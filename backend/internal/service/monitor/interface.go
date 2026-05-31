package monitor

import (
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
	alertsvc "github.com/yourorg/netmon/internal/service/alert"
)

const sysNetPath = "/sys/class/net"

func ListLocalInterfaces(names []string) ([]model.LocalInterfaceStatus, error) {
	if len(names) > 0 {
		statuses := make([]model.LocalInterfaceStatus, 0, len(names))
		for _, name := range names {
			name = strings.TrimSpace(name)
			if name == "" {
				continue
			}
			statuses = append(statuses, ReadLocalInterface(name))
		}
		return statuses, nil
	}

	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	statuses := []model.LocalInterfaceStatus{}
	for _, iface := range ifaces {
		if !monitorableInterface(iface) {
			continue
		}
		statuses = append(statuses, ReadLocalInterface(iface.Name))
	}
	return statuses, nil
}

func ReadLocalInterface(name string) model.LocalInterfaceStatus {
	now := time.Now()
	result := model.LocalInterfaceStatus{
		Interface: name,
		Type:      "unknown",
		Status:    "unknown",
		CheckedAt: now,
	}

	iface, err := net.InterfaceByName(name)
	if err != nil {
		result.Reason = stringPtr("interface not found")
		return result
	}

	isUp := iface.Flags&net.FlagUp != 0
	result.IsUp = boolPtr(isUp)
	mtu := iface.MTU
	result.MTU = &mtu
	if hw := iface.HardwareAddr.String(); hw != "" {
		result.HardwareAddr = stringPtr(hw)
	}

	result.Type = interfaceType(name, *iface)
	if carrier, err := readCarrier(name); err == nil {
		result.Carrier = &carrier
	}
	if operstate, err := readSysAttr(name, "operstate"); err == nil {
		result.OperState = stringPtr(operstate)
	}

	result.Status, result.Connected, result.Reason = classifyInterface(result)
	return result
}

func MonitorLocalInterfaces(userID string, names []string) ([]model.LocalInterfaceStatus, error) {
	statuses, err := ListLocalInterfaces(names)
	if err != nil {
		return nil, err
	}

	var errs []error
	for _, status := range statuses {
		if err := logInterfaceStatus(userID, status); err != nil {
			errs = append(errs, err)
		}
		alertsvc.EvaluateLocalInterface(status)
	}
	return statuses, errors.Join(errs...)
}

func logInterfaceStatus(userID string, status model.LocalInterfaceStatus) error {
	success := status.Connected != nil && *status.Connected
	logStatus := "down"
	switch status.Status {
	case "connected":
		logStatus = "up"
	case "disconnected", "unknown":
		logStatus = "warning"
	case "cable_unplugged", "down":
		logStatus = "down"
	}

	payload, err := json.Marshal(status)
	if err != nil {
		return err
	}
	return repository.InsertNetworkLogEntry(model.NetworkLog{
		UserID:  userID,
		Action:  "interface",
		Target:  status.Interface,
		Result:  string(payload),
		Success: success,
		Status:  logStatus,
	})
}

func monitorableInterface(iface net.Interface) bool {
	name := iface.Name
	if iface.Flags&net.FlagLoopback != 0 {
		return false
	}
	for _, prefix := range []string{"docker", "br-", "veth", "virbr", "tun", "tap"} {
		if strings.HasPrefix(name, prefix) {
			return false
		}
	}
	if fileExists(filepath.Join(sysNetPath, name, "wireless")) {
		return true
	}
	if fileExists(filepath.Join(sysNetPath, name, "device")) {
		return true
	}
	if fileExists(filepath.Join(sysNetPath, name, "carrier")) {
		return true
	}
	return false
}

func interfaceType(name string, iface net.Interface) string {
	if iface.Flags&net.FlagLoopback != 0 {
		return "loopback"
	}
	if fileExists(filepath.Join(sysNetPath, name, "wireless")) {
		return "wifi"
	}
	if fileExists(filepath.Join(sysNetPath, name, "device")) || fileExists(filepath.Join(sysNetPath, name, "carrier")) {
		return "ethernet"
	}
	return "other"
}

func classifyInterface(status model.LocalInterfaceStatus) (string, *bool, *string) {
	isUp := status.IsUp != nil && *status.IsUp
	operstate := ""
	if status.OperState != nil {
		operstate = strings.ToLower(*status.OperState)
	}

	switch status.Type {
	case "ethernet":
		if status.Carrier != nil && *status.Carrier {
			return "connected", boolPtr(true), nil
		}
		if status.Carrier != nil && !*status.Carrier {
			return "cable_unplugged", boolPtr(false), stringPtr("ethernet carrier is 0; cable is unplugged or link partner is down")
		}
		if !isUp {
			return "down", boolPtr(false), stringPtr("ethernet interface is administratively down")
		}
		if operstate == "up" {
			return "connected", boolPtr(true), nil
		}
		return "unknown", nil, stringPtr("ethernet carrier data is unavailable")
	case "wifi":
		if isUp && operstate == "up" {
			return "connected", boolPtr(true), nil
		}
		if !isUp {
			return "disconnected", boolPtr(false), stringPtr("wifi interface is down")
		}
		if operstate == "" {
			return "unknown", nil, stringPtr("wifi operstate data is unavailable")
		}
		return "disconnected", boolPtr(false), stringPtr(fmt.Sprintf("wifi operstate is %s; not connected to an access point", operstate))
	case "loopback":
		if isUp {
			return "connected", boolPtr(true), nil
		}
		return "down", boolPtr(false), stringPtr("loopback interface is down")
	default:
		if isUp && operstate == "up" {
			return "connected", boolPtr(true), nil
		}
		if !isUp {
			return "down", boolPtr(false), stringPtr("interface is down")
		}
		return "unknown", nil, stringPtr("interface type is not recognized as physical ethernet or wifi")
	}
}

func readCarrier(name string) (bool, error) {
	raw, err := readSysAttr(name, "carrier")
	if err != nil {
		return false, err
	}
	return raw == "1", nil
}

func readSysAttr(name, attr string) (string, error) {
	data, err := os.ReadFile(filepath.Join(sysNetPath, name, attr))
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(data)), nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func boolPtr(value bool) *bool {
	return &value
}

func stringPtr(value string) *string {
	return &value
}
