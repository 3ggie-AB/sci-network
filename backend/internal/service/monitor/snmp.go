package monitor

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/gosnmp/gosnmp"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

const (
	oidCPU          = ".1.3.6.1.2.1.25.3.3.1.2.196608"
	oidMemorySize   = ".1.3.6.1.2.1.25.2.2.0"
	oidIfInOctets   = ".1.3.6.1.2.1.2.2.1.10.1"
	oidIfOutOctets  = ".1.3.6.1.2.1.2.2.1.16.1"
	oidIfOperStatus = ".1.3.6.1.2.1.2.2.1.8.1"
)

func ExecuteSNMP(userID string, req model.SNMPRequest) (*model.SNMPResult, error) {
	return executeSNMP(userID, nil, req)
}

func ExecuteSNMPForDevice(userID string, device model.Device) (*model.SNMPResult, error) {
	return executeSNMP(userID, &device, model.SNMPRequest{
		Host:      device.Host,
		Community: device.SNMPCommunity,
		Version:   device.SNMPVersion,
		OIDs:      DefaultMonitorOIDs(),
		Port:      device.SNMPPort,
		Timeout:   device.SNMPTimeout,
	})
}

func executeSNMP(userID string, device *model.Device, req model.SNMPRequest) (*model.SNMPResult, error) {
	normalizeSNMPRequest(&req)

	version := gosnmp.Version2c
	switch req.Version {
	case model.SNMPv1:
		version = gosnmp.Version1
	case model.SNMPv2c:
		version = gosnmp.Version2c
	}

	g := &gosnmp.GoSNMP{
		Target:    req.Host,
		Port:      req.Port,
		Community: req.Community,
		Version:   version,
		Timeout:   time.Duration(req.Timeout) * time.Second,
		Retries:   2,
	}

	start := time.Now()
	result := &model.SNMPResult{
		Host:    req.Host,
		OIDData: make(map[string]string),
	}

	if err := g.Connect(); err != nil {
		result.Error = err.Error()
		logSNMP(userID, device, result, false, time.Since(start).Milliseconds())
		return result, nil
	}
	defer g.Conn.Close()

	pdu, err := g.Get(req.OIDs)
	elapsed := time.Since(start).Milliseconds()
	if err != nil {
		result.Error = err.Error()
		logSNMP(userID, device, result, false, elapsed)
		return result, nil
	}

	for _, variable := range pdu.Variables {
		result.OIDData[variable.Name] = snmpValueToString(variable)
	}

	logSNMP(userID, device, result, true, elapsed)
	return result, nil
}

func normalizeSNMPRequest(req *model.SNMPRequest) {
	if req.Port == 0 {
		req.Port = 161
	}
	if req.Community == "" {
		req.Community = "public"
	}
	if req.Timeout == 0 {
		req.Timeout = 5
	}
	if req.Version == "" {
		req.Version = model.SNMPv2c
	}
	if len(req.OIDs) == 0 {
		req.OIDs = DefaultMonitorOIDs()
	}
}

func snmpValueToString(v gosnmp.SnmpPDU) string {
	switch v.Type {
	case gosnmp.OctetString:
		b, ok := v.Value.([]byte)
		if ok {
			return string(b)
		}
	case gosnmp.Integer:
		return fmt.Sprintf("%d", gosnmp.ToBigInt(v.Value))
	case gosnmp.Counter32, gosnmp.Gauge32, gosnmp.TimeTicks:
		return fmt.Sprintf("%d", gosnmp.ToBigInt(v.Value))
	case gosnmp.Counter64:
		return fmt.Sprintf("%d", gosnmp.ToBigInt(v.Value))
	case gosnmp.IPAddress:
		return fmt.Sprintf("%s", v.Value)
	case gosnmp.ObjectIdentifier:
		return fmt.Sprintf("%s", v.Value)
	case gosnmp.Null:
		return "null"
	}
	return fmt.Sprintf("%v", v.Value)
}

func CommonOIDs() map[string]string {
	return map[string]string{
		"sysDescr":        ".1.3.6.1.2.1.1.1.0",
		"sysObjectID":     ".1.3.6.1.2.1.1.2.0",
		"sysUpTime":       ".1.3.6.1.2.1.1.3.0",
		"sysContact":      ".1.3.6.1.2.1.1.4.0",
		"sysName":         ".1.3.6.1.2.1.1.5.0",
		"sysLocation":     ".1.3.6.1.2.1.1.6.0",
		"ifNumber":        ".1.3.6.1.2.1.2.1.0",
		"ifInOctets":      oidIfInOctets,
		"ifOutOctets":     oidIfOutOctets,
		"ifOperStatus":    oidIfOperStatus,
		"ipAdEntAddr":     ".1.3.6.1.2.1.4.20.1.1",
		"hrMemorySize":    oidMemorySize,
		"hrProcessorLoad": oidCPU,
	}
}

func DefaultMonitorOIDs() []string {
	return []string{
		".1.3.6.1.2.1.1.3.0",
		oidIfOperStatus,
		oidIfInOctets,
		oidIfOutOctets,
		oidMemorySize,
		oidCPU,
	}
}

func logSNMP(userID string, device *model.Device, result *model.SNMPResult, success bool, elapsed int64) {
	status := model.DeviceStatusWarning
	if success {
		status = model.DeviceStatusHealthy
	}
	deviceID := ""
	if device != nil {
		deviceID = device.ID
	}

	cpu, memory, bandwidthIn, bandwidthOut := extractSNMPMetrics(result)
	resultJSON, _ := json.Marshal(result)
	_ = repository.InsertNetworkLogEntry(model.NetworkLog{
		UserID:       userID,
		DeviceID:     deviceID,
		Action:       "snmp",
		Target:       result.Host,
		Result:       string(resultJSON),
		Success:      success,
		Duration:     elapsed,
		ResponseTime: elapsed,
		Status:       monitorStatusLabel(status),
		CPU:          cpu,
		Memory:       memory,
		BandwidthIn:  bandwidthIn,
		BandwidthOut: bandwidthOut,
	})
}

func extractSNMPMetrics(result *model.SNMPResult) (cpu, memory, bandwidthIn, bandwidthOut float64) {
	if result == nil {
		return 0, 0, 0, 0
	}

	cpu = parseSNMPFloat(result.OIDData[oidCPU])
	memory = parseSNMPFloat(result.OIDData[oidMemorySize])
	bandwidthIn = parseSNMPFloat(result.OIDData[oidIfInOctets])
	bandwidthOut = parseSNMPFloat(result.OIDData[oidIfOutOctets])
	return cpu, memory, bandwidthIn, bandwidthOut
}

func parseSNMPFloat(value string) float64 {
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0
	}
	return parsed
}
