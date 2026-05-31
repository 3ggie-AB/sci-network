package monitor

import (
	"encoding/json"
	"fmt"
	"net"
	"os/exec"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

func ExecutePing(userID string, req model.PingRequest) (*model.PingResult, error) {
	return executePing(userID, nil, req)
}

func ExecutePingForDevice(userID string, device model.Device) (*model.PingResult, error) {
	return executePing(userID, &device, model.PingRequest{
		Host:  device.Host,
		Count: 4,
	})
}

func executePing(userID string, device *model.Device, req model.PingRequest) (*model.PingResult, error) {
	if req.Count <= 0 || req.Count > 20 {
		req.Count = 4
	}

	host := strings.TrimSpace(req.Host)
	if err := validateHost(host); err != nil {
		return nil, err
	}

	start := time.Now()
	result, err := runPingCommand(host, req.Count)
	elapsed := time.Since(start).Milliseconds()

	success := err == nil && result != nil && result.IsAlive
	status := pingStatus(device, result, success)
	deviceID := ""
	if device != nil {
		deviceID = device.ID
	}

	resultJSON, _ := json.Marshal(result)
	_ = repository.InsertNetworkLogEntry(model.NetworkLog{
		UserID:       userID,
		DeviceID:     deviceID,
		Action:       "ping",
		Target:       host,
		Result:       string(resultJSON),
		Success:      success,
		Duration:     elapsed,
		Latency:      safePingLatency(result),
		PacketLoss:   safePingPacketLoss(result),
		Jitter:       safePingJitter(result),
		ResponseTime: elapsed,
		Status:       monitorStatusLabel(status),
	})

	if err != nil {
		return nil, err
	}
	return result, nil
}

func validateHost(host string) error {
	if host == "" {
		return fmt.Errorf("host wajib diisi")
	}
	if net.ParseIP(host) != nil {
		return nil
	}

	ips, err := net.LookupHost(host)
	if err != nil {
		return fmt.Errorf("host tidak dapat di-resolve: %v", err)
	}
	if len(ips) == 0 {
		return fmt.Errorf("host tidak ditemukan")
	}
	return nil
}

func runPingCommand(host string, count int) (*model.PingResult, error) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("ping", "-n", strconv.Itoa(count), host)
	default:
		cmd = exec.Command("ping", "-c", strconv.Itoa(count), "-W", "2", host)
	}

	out, err := cmd.CombinedOutput()
	output := string(out)

	result := &model.PingResult{
		Host:        host,
		PacketsSent: count,
	}

	if err != nil && !strings.Contains(output, "packets transmitted") {
		result.IsAlive = false
		result.PacketLoss = 100
		return result, nil
	}

	parsePingOutput(output, result)
	return result, nil
}

func parsePingOutput(output string, result *model.PingResult) {
	reTransmit := regexp.MustCompile(`(?m)(\d+)\s+packets?\s+transmitted,\s+(\d+)\s+(?:packets?\s+)?(?:received|recv)`)
	if m := reTransmit.FindStringSubmatch(output); len(m) >= 3 {
		result.PacketsSent, _ = strconv.Atoi(m[1])
		result.PacketsRecv, _ = strconv.Atoi(m[2])
	}

	reLoss := regexp.MustCompile(`(\d+(?:\.\d+)?)% packet loss`)
	if m := reLoss.FindStringSubmatch(output); len(m) >= 2 {
		result.PacketLoss, _ = strconv.ParseFloat(m[1], 64)
	}

	reRtt := regexp.MustCompile(`(?:rtt|round-trip) min/avg/max/(?:mdev|stddev) = ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+)`)
	if m := reRtt.FindStringSubmatch(output); len(m) >= 5 {
		result.MinRtt, _ = strconv.ParseFloat(m[1], 64)
		result.AvgRtt, _ = strconv.ParseFloat(m[2], 64)
		result.MaxRtt, _ = strconv.ParseFloat(m[3], 64)
		result.Jitter, _ = strconv.ParseFloat(m[4], 64)
	}

	if result.PacketsRecv == 0 {
		result.PacketsRecv = countPingReplies(output)
	}
	if result.PacketsRecv == 0 && result.PacketsSent > 0 && result.PacketLoss < 100 {
		recv := result.PacketsSent - int(float64(result.PacketsSent)*result.PacketLoss/100)
		if recv > 0 {
			result.PacketsRecv = recv
		}
	}
	if result.PacketsSent > 0 {
		result.PacketLoss = float64(result.PacketsSent-result.PacketsRecv) / float64(result.PacketsSent) * 100
	}

	result.IsAlive = result.PacketsRecv > 0
	if !result.IsAlive {
		result.MinRtt = 0
		result.AvgRtt = 0
		result.MaxRtt = 0
		result.Jitter = 0
	}
}

func countPingReplies(output string) int {
	count := 0
	for _, line := range strings.Split(strings.ToLower(output), "\n") {
		if strings.Contains(line, "bytes from") ||
			strings.Contains(line, "reply from") ||
			strings.Contains(line, "time=") {
			count++
		}
	}
	return count
}

func pingStatus(device *model.Device, result *model.PingResult, success bool) model.DeviceStatus {
	if !success || result == nil {
		return model.DeviceStatusDown
	}

	packetLossWarning := 5.0
	packetLossCritical := 20.0
	latencyWarning := 150.0
	latencyCritical := 500.0
	if device != nil {
		packetLossWarning = device.PacketLossWarning
		packetLossCritical = device.PacketLossCritical
		latencyWarning = device.LatencyWarningMs
		latencyCritical = device.LatencyCriticalMs
	}

	if result.PacketLoss >= packetLossCritical || result.AvgRtt >= latencyCritical {
		return model.DeviceStatusCritical
	}
	if result.PacketLoss >= packetLossWarning || result.AvgRtt >= latencyWarning {
		return model.DeviceStatusWarning
	}
	return model.DeviceStatusHealthy
}

func safePingLatency(result *model.PingResult) float64 {
	if result == nil {
		return 0
	}
	return result.AvgRtt
}

func safePingPacketLoss(result *model.PingResult) float64 {
	if result == nil {
		return 100
	}
	return result.PacketLoss
}

func safePingJitter(result *model.PingResult) float64 {
	if result == nil {
		return 0
	}
	return result.Jitter
}
