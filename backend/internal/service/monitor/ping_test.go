package monitor

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/yourorg/netmon/internal/model"
)

func TestParsePingOutputSetsReceivedWhenRTTPresent(t *testing.T) {
	output := `PING 10.1.0.1 (10.1.0.1) 56(84) bytes of data.
64 bytes from 10.1.0.1: icmp_seq=1 ttl=64 time=17.365 ms
64 bytes from 10.1.0.1: icmp_seq=2 ttl=64 time=73.641 ms
64 bytes from 10.1.0.1: icmp_seq=3 ttl=64 time=20.120 ms
64 bytes from 10.1.0.1: icmp_seq=4 ttl=64 time=18.650 ms

--- 10.1.0.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 17.365/32.444/73.641/23.800 ms`

	result := &model.PingResult{Host: "10.1.0.1", PacketsSent: 4}
	parsePingOutput(output, result)

	if !result.IsAlive {
		t.Fatal("expected ping to be alive")
	}
	if result.PacketsRecv != 4 {
		t.Fatalf("expected 4 received packets, got %d", result.PacketsRecv)
	}
	if result.AvgRtt != 32.444 {
		t.Fatalf("expected avg RTT 32.444, got %.3f", result.AvgRtt)
	}
}

func TestParsePingOutputZerosRTTWhenNoPacketsReceived(t *testing.T) {
	output := `--- 10.1.0.1 ping statistics ---
4 packets transmitted, 0 received, 100% packet loss, time 3005ms
rtt min/avg/max/mdev = 17.365/32.444/73.641/23.800 ms`

	result := &model.PingResult{Host: "10.1.0.1", PacketsSent: 4}
	parsePingOutput(output, result)

	if result.IsAlive {
		t.Fatal("expected ping to be down")
	}
	if result.PacketsRecv != 0 {
		t.Fatalf("expected 0 received packets, got %d", result.PacketsRecv)
	}
	if result.MinRtt != 0 || result.AvgRtt != 0 || result.MaxRtt != 0 || result.Jitter != 0 {
		t.Fatalf("expected RTT fields to be zeroed, got min=%.3f avg=%.3f max=%.3f jitter=%.3f",
			result.MinRtt, result.AvgRtt, result.MaxRtt, result.Jitter)
	}
}

func TestHTTPStatusClassification(t *testing.T) {
	cases := []struct {
		name       string
		statusCode int
		isUp       bool
		status     model.DeviceStatus
	}{
		{name: "ok", statusCode: 200, isUp: true, status: model.DeviceStatusHealthy},
		{name: "not_found", statusCode: 404, isUp: true, status: model.DeviceStatusHealthy},
		{name: "server_error", statusCode: 500, isUp: false, status: model.DeviceStatusWarning},
		{name: "transport_error", statusCode: 0, isUp: false, status: model.DeviceStatusCritical},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := isHTTPUp(tc.statusCode); got != tc.isUp {
				t.Fatalf("expected isHTTPUp(%d)=%v, got %v", tc.statusCode, tc.isUp, got)
			}
			result := &model.HTTPGetResult{StatusCode: tc.statusCode}
			if got := httpStatus(nil, result); got != tc.status {
				t.Fatalf("expected status %q, got %q", tc.status, got)
			}
		})
	}
}

func TestHTTPLogResultJSONOmitsBody(t *testing.T) {
	result := &model.HTTPGetResult{
		URL:           "https://example.com",
		StatusCode:    200,
		Status:        "200 OK",
		ContentType:   "text/html; charset=utf-8",
		Body:          strings.Repeat("<html>heavy</html>", 256),
		BodyTruncated: true,
		Duration:      123,
		IsUp:          true,
	}

	payload := httpLogResultJSON(result)
	if strings.Contains(payload, "<html>heavy</html>") {
		t.Fatal("expected ClickHouse HTTP log payload to omit response body")
	}
	if result.Body == "" {
		t.Fatal("expected original HTTP result body to remain available")
	}

	var stored map[string]any
	if err := json.Unmarshal([]byte(payload), &stored); err != nil {
		t.Fatalf("expected valid JSON payload, got %v", err)
	}
	if _, ok := stored["body"]; ok {
		t.Fatal("expected body field to be absent from stored HTTP log payload")
	}
	if stored["body_omitted"] != true {
		t.Fatalf("expected body_omitted=true, got %v", stored["body_omitted"])
	}
	if stored["body_truncated"] != true {
		t.Fatalf("expected body_truncated=true, got %v", stored["body_truncated"])
	}
}

func TestHTTPLogResultJSONKeepsNonHTMLBody(t *testing.T) {
	result := &model.HTTPGetResult{
		URL:         "https://api.example.com/health",
		StatusCode:  200,
		Status:      "200 OK",
		ContentType: "application/json",
		Body:        `{"ok":true}`,
		Duration:    45,
		IsUp:        true,
	}

	payload := httpLogResultJSON(result)

	var stored map[string]any
	if err := json.Unmarshal([]byte(payload), &stored); err != nil {
		t.Fatalf("expected valid JSON payload, got %v", err)
	}
	if stored["body"] != result.Body {
		t.Fatalf("expected non-HTML body to be stored, got %v", stored["body"])
	}
	if _, ok := stored["body_omitted"]; ok {
		t.Fatal("expected body_omitted to be absent for non-HTML body")
	}
}
