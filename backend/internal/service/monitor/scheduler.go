package monitor

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/yourorg/netmon/config"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
	alertsvc "github.com/yourorg/netmon/internal/service/alert"
)

const schedulerUserID = "scheduler"

var defaultScheduler *Scheduler

type Scheduler struct {
	enabled  bool
	interval time.Duration
	cancel   context.CancelFunc
	wg       sync.WaitGroup

	mu      sync.RWMutex
	running bool
	lastRun *time.Time
	lastErr string
}

func NewScheduler(enabled bool, intervalSeconds int) *Scheduler {
	if intervalSeconds <= 0 {
		intervalSeconds = 60
	}
	return &Scheduler{
		enabled:  enabled,
		interval: time.Duration(intervalSeconds) * time.Second,
	}
}

func SetDefaultScheduler(s *Scheduler) {
	defaultScheduler = s
}

func DefaultSchedulerStatus() model.MonitorSchedulerStatus {
	if defaultScheduler == nil {
		return model.MonitorSchedulerStatus{}
	}
	return defaultScheduler.Status()
}

func (s *Scheduler) Start(parent context.Context) {
	if s == nil || !s.enabled {
		return
	}

	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	ctx, cancel := context.WithCancel(parent)
	s.cancel = cancel
	s.running = true
	s.mu.Unlock()

	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		log.Printf("[MONITOR] Scheduler aktif setiap %s", s.interval)
		s.runOnce()

		ticker := time.NewTicker(s.interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.runOnce()
			}
		}
	}()
}

func (s *Scheduler) Stop() {
	if s == nil {
		return
	}
	if s.cancel != nil {
		s.cancel()
	}
	s.wg.Wait()

	s.mu.Lock()
	s.running = false
	s.mu.Unlock()
}

func (s *Scheduler) Status() model.MonitorSchedulerStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var lastRun *time.Time
	if s.lastRun != nil {
		copied := *s.lastRun
		lastRun = &copied
	}

	return model.MonitorSchedulerStatus{
		Enabled:         s.enabled,
		Running:         s.running,
		IntervalSeconds: int(s.interval.Seconds()),
		LastRunAt:       lastRun,
		LastError:       s.lastErr,
	}
}

func (s *Scheduler) runOnce() {
	now := time.Now()
	lastErr := ""

	if config.App == nil || config.App.LocalInterfaceMonitorEnabled {
		if _, err := MonitorLocalInterfaces(schedulerUserID, localInterfaceNames()); err != nil {
			lastErr = err.Error()
			log.Printf("[MONITOR] gagal cek interface lokal: %v", err)
		}
	}

	targets, err := repository.ListMonitorTargets()
	if err != nil {
		s.markRun(now, err.Error())
		log.Printf("[MONITOR] gagal ambil target: %v", err)
		return
	}

	for _, device := range targets {
		status, ran, probes := s.checkDevice(device, now)
		if !ran {
			continue
		}
		if err := repository.UpdateDeviceProbeChecks(device.ID, status, probes); err != nil {
			log.Printf("[MONITOR] gagal update status device %s: %v", device.ID, err)
		}
	}

	s.markRun(now, lastErr)
}

func (s *Scheduler) checkDevice(device model.Device, now time.Time) (model.DeviceStatus, bool, []string) {
	status := model.DeviceStatusUnknown
	probes := []string{}

	if device.PingEnabled && checkDue(device.LastPingCheckedAt, device.PingIntervalSeconds, device.CheckIntervalSeconds, now) {
		result, err := ExecutePingForDevice(schedulerUserID, device)
		status = mergeDeviceStatus(status, alertsvc.EvaluatePing(device, result, err))
		probes = append(probes, "ping")
	}

	if device.SNMPEnabled && checkDue(device.LastSNMPCheckedAt, device.SNMPIntervalSeconds, device.CheckIntervalSeconds, now) {
		result, err := ExecuteSNMPForDevice(schedulerUserID, device)
		status = mergeDeviceStatus(status, alertsvc.EvaluateSNMP(device, result, err))
		probes = append(probes, "snmp")
	}

	if device.HTTPEnabled && checkDue(device.LastHTTPCheckedAt, device.HTTPIntervalSeconds, device.CheckIntervalSeconds, now) {
		result, err := ExecuteHTTPGetForDevice(schedulerUserID, device)
		status = mergeDeviceStatus(status, alertsvc.EvaluateHTTP(device, result, err))
		probes = append(probes, "http")
	}

	if len(probes) == 0 {
		return model.DeviceStatusUnknown, false, nil
	}

	if status == model.DeviceStatusUnknown {
		status = model.DeviceStatusHealthy
	}
	return status, true, probes
}

func (s *Scheduler) markRun(t time.Time, errMsg string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.lastRun = &t
	s.lastErr = errMsg
}

func checkDue(lastCheckedAt *time.Time, intervalSeconds, fallbackSeconds int, now time.Time) bool {
	if lastCheckedAt == nil {
		return true
	}

	if intervalSeconds <= 0 {
		intervalSeconds = fallbackSeconds
	}
	if intervalSeconds <= 0 {
		intervalSeconds = 60
	}
	interval := time.Duration(intervalSeconds) * time.Second
	if interval <= 0 {
		interval = time.Minute
	}
	return now.Sub(*lastCheckedAt) >= interval
}

func mergeDeviceStatus(current, next model.DeviceStatus) model.DeviceStatus {
	if deviceStatusRank(next) > deviceStatusRank(current) {
		return next
	}
	return current
}

func deviceStatusRank(status model.DeviceStatus) int {
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

func localInterfaceNames() []string {
	if config.App == nil || config.App.LocalInterfaceNames == "" {
		return nil
	}
	raw := strings.Split(config.App.LocalInterfaceNames, ",")
	names := make([]string, 0, len(raw))
	for _, name := range raw {
		name = strings.TrimSpace(name)
		if name != "" {
			names = append(names, name)
		}
	}
	return names
}
