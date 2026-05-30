package service

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

// ExecutePing performs ICMP ping to a host
func ExecutePing(userID string, req model.PingRequest) (*model.PingResult, error) {
	if req.Count <= 0 || req.Count > 20 {
		req.Count = 4
	}

	// Validate host/IP
	host := req.Host
	if net.ParseIP(host) == nil {
		ips, err := net.LookupHost(host)
		if err != nil {
			return nil, fmt.Errorf("host tidak dapat di-resolve: %v", err)
		}
		if len(ips) == 0 {
			return nil, fmt.Errorf("host tidak ditemukan")
		}
	}

	start := time.Now()
	result, err := runPingCommand(host, req.Count)
	elapsed := time.Since(start).Milliseconds()

	resultJSON, _ := json.Marshal(result)
	success := err == nil && result != nil && result.IsAlive

	// Log ke ClickHouse
	_ = repository.InsertNetworkLog(userID, "ping", host, string(resultJSON), success, elapsed)

	if err != nil {
		return nil, err
	}
	return result, nil
}

func runPingCommand(host string, count int) (*model.PingResult, error) {
	var cmd *exec.Cmd

	os := runtime.GOOS
	switch os {
	case "windows":
		cmd = exec.Command("ping", "-n", strconv.Itoa(count), host)
	default: // linux, darwin
		cmd = exec.Command("ping", "-c", strconv.Itoa(count), "-W", "2", host)
	}

	out, err := cmd.CombinedOutput()
	output := string(out)

	result := &model.PingResult{
		Host:        host,
		PacketsSent: count,
	}

	if err != nil {
		// Check if it's just packet loss or actual error
		if !strings.Contains(output, "packets transmitted") {
			result.IsAlive = false
			result.PacketLoss = 100
			return result, nil
		}
	}

	// Parse Linux/Mac ping output
	parseLinuxPing(output, result)
	return result, nil
}

func parseLinuxPing(output string, result *model.PingResult) {
	// packets transmitted
	reTransmit := regexp.MustCompile(`(\d+) packets transmitted, (\d+) (?:packets )?received`)
	if m := reTransmit.FindStringSubmatch(output); len(m) >= 3 {
		result.PacketsSent, _ = strconv.Atoi(m[1])
		result.PacketsRecv, _ = strconv.Atoi(m[2])
		if result.PacketsSent > 0 {
			result.PacketLoss = float64(result.PacketsSent-result.PacketsRecv) / float64(result.PacketsSent) * 100
		}
	}

	// packet loss
	reLoss := regexp.MustCompile(`(\d+(?:\.\d+)?)% packet loss`)
	if m := reLoss.FindStringSubmatch(output); len(m) >= 2 {
		result.PacketLoss, _ = strconv.ParseFloat(m[1], 64)
	}

	// rtt min/avg/max
	reRtt := regexp.MustCompile(`rtt min/avg/max/mdev = ([\d.]+)/([\d.]+)/([\d.]+)`)
	if m := reRtt.FindStringSubmatch(output); len(m) >= 4 {
		result.MinRtt, _ = strconv.ParseFloat(m[1], 64)
		result.AvgRtt, _ = strconv.ParseFloat(m[2], 64)
		result.MaxRtt, _ = strconv.ParseFloat(m[3], 64)
	}

	result.IsAlive = result.PacketsRecv > 0
}
