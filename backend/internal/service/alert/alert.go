package alert

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"regexp"
	"strings"
	"time"

	"github.com/yourorg/netmon/config"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

func EvaluatePing(device model.Device, result *model.PingResult, checkErr error) model.DeviceStatus {
	if result == nil || checkErr != nil || !result.IsAlive {
		raise(device, model.AlertSeverityCritical, "availability", 1, 0,
			fmt.Sprintf("%s tidak merespons ping", device.Name))
		return model.DeviceStatusDown
	}
	resolve(device.ID, "availability")

	status := model.DeviceStatusHealthy
	if result.PacketLoss >= device.PacketLossCritical {
		raise(device, model.AlertSeverityCritical, "packet_loss", device.PacketLossCritical, result.PacketLoss,
			fmt.Sprintf("%s packet loss %.2f%%", device.Name, result.PacketLoss))
		status = model.DeviceStatusCritical
	} else if result.PacketLoss >= device.PacketLossWarning {
		raise(device, model.AlertSeverityWarning, "packet_loss", device.PacketLossWarning, result.PacketLoss,
			fmt.Sprintf("%s packet loss %.2f%%", device.Name, result.PacketLoss))
		status = model.DeviceStatusWarning
	} else {
		resolve(device.ID, "packet_loss")
	}

	if result.AvgRtt >= device.LatencyCriticalMs {
		raise(device, model.AlertSeverityCritical, "latency", device.LatencyCriticalMs, result.AvgRtt,
			fmt.Sprintf("%s latency %.2fms", device.Name, result.AvgRtt))
		status = maxStatus(status, model.DeviceStatusCritical)
	} else if result.AvgRtt >= device.LatencyWarningMs {
		raise(device, model.AlertSeverityWarning, "latency", device.LatencyWarningMs, result.AvgRtt,
			fmt.Sprintf("%s latency %.2fms", device.Name, result.AvgRtt))
		status = maxStatus(status, model.DeviceStatusWarning)
	} else {
		resolve(device.ID, "latency")
	}

	return status
}

func EvaluateHTTP(device model.Device, result *model.HTTPGetResult, checkErr error) model.DeviceStatus {
	if result == nil || checkErr != nil || result.StatusCode == 0 {
		actual := 0.0
		if result != nil {
			actual = float64(result.StatusCode)
		}
		raise(device, model.AlertSeverityCritical, "http_availability", 1, actual,
			fmt.Sprintf("%s HTTP check gagal", device.Name))
		return model.DeviceStatusDown
	}
	resolve(device.ID, "http_availability")

	if result.StatusCode >= http.StatusInternalServerError {
		raise(device, model.AlertSeverityWarning, "http_status", 500, float64(result.StatusCode),
			fmt.Sprintf("%s HTTP status %d", device.Name, result.StatusCode))
		return model.DeviceStatusWarning
	}
	resolve(device.ID, "http_status")

	responseTime := float64(result.Duration)
	if responseTime >= device.ResponseTimeCriticalMs {
		raise(device, model.AlertSeverityCritical, "response_time", device.ResponseTimeCriticalMs, responseTime,
			fmt.Sprintf("%s response time %.0fms", device.Name, responseTime))
		return model.DeviceStatusCritical
	}
	if responseTime >= device.ResponseTimeWarningMs {
		raise(device, model.AlertSeverityWarning, "response_time", device.ResponseTimeWarningMs, responseTime,
			fmt.Sprintf("%s response time %.0fms", device.Name, responseTime))
		return model.DeviceStatusWarning
	}

	resolve(device.ID, "response_time")
	return model.DeviceStatusHealthy
}

func EvaluateSNMP(device model.Device, result *model.SNMPResult, checkErr error) model.DeviceStatus {
	if result == nil || checkErr != nil || result.Error != "" {
		raise(device, model.AlertSeverityWarning, "snmp", 1, 0,
			fmt.Sprintf("%s SNMP check gagal", device.Name))
		return model.DeviceStatusWarning
	}

	resolve(device.ID, "snmp")
	return model.DeviceStatusHealthy
}

func EvaluateLocalInterface(result model.LocalInterfaceStatus) model.DeviceStatus {
	if result.Interface == "" {
		return model.DeviceStatusUnknown
	}

	device, err := repository.EnsureLocalAgentDevice()
	if err != nil {
		log.Printf("[ALERT] gagal siapkan local agent device: %v", err)
		return model.DeviceStatusUnknown
	}

	metric := localInterfaceMetric(result.Interface)
	if result.Connected != nil && *result.Connected {
		resolve(device.ID, metric)
		return model.DeviceStatusHealthy
	}

	severity := model.AlertSeverityWarning
	status := model.DeviceStatusWarning
	if result.Type == "ethernet" && (result.Status == "cable_unplugged" || result.Status == "down") {
		severity = model.AlertSeverityCritical
		status = model.DeviceStatusDown
	}

	message := localInterfaceAlertMessage(result)
	raise(*device, severity, metric, 1, 0, message)
	return status
}

func raise(device model.Device, severity model.AlertSeverity, metric string, threshold, actual float64, message string) {
	alert, created, err := repository.UpsertOpenAlert(model.Alert{
		DeviceID:       device.ID,
		Severity:       severity,
		Status:         model.AlertStatusOpen,
		Metric:         metric,
		ThresholdValue: threshold,
		ActualValue:    actual,
		Message:        message,
	})
	if err != nil {
		log.Printf("[ALERT] gagal simpan alert %s/%s: %v", device.ID, metric, err)
		return
	}
	if created {
		dispatch(alert)
	}
}

func localInterfaceMetric(name string) string {
	safe := regexp.MustCompile(`[^a-zA-Z0-9_:-]+`).ReplaceAllString(name, "_")
	metric := "interface:" + safe
	if len(metric) > 50 {
		return metric[:50]
	}
	return metric
}

func localInterfaceAlertMessage(result model.LocalInterfaceStatus) string {
	reason := ""
	if result.Reason != nil && *result.Reason != "" {
		reason = ": " + *result.Reason
	}
	switch result.Status {
	case "cable_unplugged":
		return fmt.Sprintf("Ethernet cable unplugged on %s%s", result.Interface, reason)
	case "disconnected":
		if result.Type == "wifi" {
			return fmt.Sprintf("WiFi disconnected on %s%s", result.Interface, reason)
		}
		return fmt.Sprintf("Network interface disconnected on %s%s", result.Interface, reason)
	case "down":
		return fmt.Sprintf("Network interface down on %s%s", result.Interface, reason)
	default:
		return fmt.Sprintf("Network interface %s status %s%s", result.Interface, result.Status, reason)
	}
}

func resolve(deviceID, metric string) {
	if err := repository.ResolveOpenAlert(deviceID, metric); err != nil {
		log.Printf("[ALERT] gagal resolve alert %s/%s: %v", deviceID, metric, err)
	}
}

func dispatch(alert *model.Alert) {
	if alert == nil || config.App == nil {
		return
	}

	message := fmt.Sprintf("[%s] %s", strings.ToUpper(string(alert.Severity)), alert.Message)

	if config.App.AlertWebhookURL != "" {
		sendWebhook(config.App.AlertWebhookURL, alert, message)
	}
	if config.App.AlertTelegramBotToken != "" && config.App.AlertTelegramChatID != "" {
		sendTelegram(config.App.AlertTelegramBotToken, config.App.AlertTelegramChatID, message)
	}
	if config.App.AlertEmailSMTPHost != "" && config.App.AlertEmailTo != "" {
		sendEmail(message)
	}
}

func sendWebhook(webhookURL string, alert *model.Alert, message string) {
	payload := map[string]interface{}{
		"text":       message,
		"alert_id":   alert.ID,
		"device_id":  alert.DeviceID,
		"severity":   alert.Severity,
		"metric":     alert.Metric,
		"value":      alert.ActualValue,
		"threshold":  alert.ThresholdValue,
		"created_at": time.Now().Format(time.RFC3339),
	}

	body, _ := json.Marshal(payload)
	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("[ALERT] webhook gagal: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		log.Printf("[ALERT] webhook status tidak sukses: %s", resp.Status)
	}
}

func sendTelegram(token, chatID, message string) {
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	payload := map[string]string{
		"chat_id": chatID,
		"text":    message,
	}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(endpoint, "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("[ALERT] telegram gagal: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= http.StatusBadRequest {
		log.Printf("[ALERT] telegram status tidak sukses: %s", resp.Status)
	}
}

func sendEmail(message string) {
	cfg := config.App
	from := cfg.AlertEmailFrom
	if from == "" {
		from = cfg.AlertEmailUsername
	}
	if from == "" {
		log.Println("[ALERT] email from belum dikonfigurasi")
		return
	}

	addr := fmt.Sprintf("%s:%s", cfg.AlertEmailSMTPHost, cfg.AlertEmailSMTPPort)
	subject := "SCINetwork Alert"
	body := "To: " + cfg.AlertEmailTo + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
		message + "\r\n"

	var auth smtp.Auth
	if cfg.AlertEmailUsername != "" {
		auth = smtp.PlainAuth("", cfg.AlertEmailUsername, cfg.AlertEmailPassword, cfg.AlertEmailSMTPHost)
	}

	recipients := splitRecipients(cfg.AlertEmailTo)
	if err := smtp.SendMail(addr, auth, from, recipients, []byte(body)); err != nil {
		log.Printf("[ALERT] email gagal: %v", err)
	}
}

func splitRecipients(raw string) []string {
	parts := strings.Split(raw, ",")
	recipients := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			recipients = append(recipients, part)
		}
	}
	return recipients
}

func maxStatus(a, b model.DeviceStatus) model.DeviceStatus {
	if severityRank(b) > severityRank(a) {
		return b
	}
	return a
}

func severityRank(status model.DeviceStatus) int {
	switch status {
	case model.DeviceStatusDown:
		return 4
	case model.DeviceStatusCritical:
		return 3
	case model.DeviceStatusWarning:
		return 2
	case model.DeviceStatusHealthy:
		return 1
	default:
		return 0
	}
}
