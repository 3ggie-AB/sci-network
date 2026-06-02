package push

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/yourorg/netmon/config"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
)

var keyInit sync.Once
var keyInitErr error

type alertPayload struct {
	Title              string       `json:"title"`
	Body               string       `json:"body"`
	Icon               string       `json:"icon"`
	Badge              string       `json:"badge"`
	Tag                string       `json:"tag"`
	URL                string       `json:"url"`
	RequireInteraction bool         `json:"requireInteraction"`
	Alert              *model.Alert `json:"alert"`
}

func PublicKey() (string, error) {
	if err := ensureVAPIDKeys(); err != nil {
		return "", err
	}
	if config.App == nil {
		return "", fmt.Errorf("config belum siap")
	}
	return config.App.VAPIDPublicKey, nil
}

func SendAlert(alert *model.Alert) {
	if alert == nil {
		return
	}
	if err := ensureVAPIDKeys(); err != nil {
		log.Printf("[PUSH] VAPID belum siap: %v", err)
		return
	}

	subs, err := repository.ListPushSubscriptions()
	if err != nil {
		log.Printf("[PUSH] gagal ambil subscriptions: %v", err)
		return
	}
	if len(subs) == 0 {
		return
	}

	body, err := json.Marshal(alertPayload{
		Title:              "SCINetwork Alert",
		Body:               alert.Message,
		Icon:               "/logo.png",
		Badge:              "/logo.png",
		Tag:                "scinetwork-alert-" + alert.ID,
		URL:                "/dashboard/alerts",
		RequireInteraction: alert.Severity == model.AlertSeverityCritical,
		Alert:              alert,
	})
	if err != nil {
		log.Printf("[PUSH] gagal encode payload: %v", err)
		return
	}

	for _, sub := range subs {
		sendToSubscription(sub, body)
	}
}

func ensureVAPIDKeys() error {
	keyInit.Do(func() {
		if config.App == nil {
			keyInitErr = fmt.Errorf("config belum siap")
			return
		}
		if config.App.VAPIDPublicKey != "" && config.App.VAPIDPrivateKey != "" {
			return
		}

		privateKey, publicKey, err := webpush.GenerateVAPIDKeys()
		if err != nil {
			keyInitErr = err
			return
		}

		config.App.VAPIDPrivateKey = privateKey
		config.App.VAPIDPublicKey = publicKey
		log.Println("[PUSH] VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY kosong; memakai key sementara untuk development")
		log.Printf("[PUSH] Simpan VAPID_PUBLIC_KEY=%s", publicKey)
		log.Printf("[PUSH] Simpan VAPID_PRIVATE_KEY=%s", privateKey)
	})
	return keyInitErr
}

func sendToSubscription(sub model.PushSubscription, body []byte) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	resp, err := webpush.SendNotificationWithContext(
		ctx,
		body,
		&webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.P256dh,
				Auth:   sub.Auth,
			},
		},
		&webpush.Options{
			Subscriber:      subscriber(),
			VAPIDPublicKey:  config.App.VAPIDPublicKey,
			VAPIDPrivateKey: config.App.VAPIDPrivateKey,
			TTL:             60,
			Urgency:         webpush.UrgencyHigh,
			Topic:           "scinetwork-alert",
		},
	)
	if err != nil {
		log.Printf("[PUSH] gagal kirim ke subscription %s: %v", sub.ID, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusGone || resp.StatusCode == http.StatusNotFound {
		if err := repository.DeletePushSubscriptionByEndpoint(sub.Endpoint); err != nil {
			log.Printf("[PUSH] gagal hapus subscription mati %s: %v", sub.ID, err)
		}
		return
	}
	if resp.StatusCode >= http.StatusBadRequest {
		log.Printf("[PUSH] provider status tidak sukses untuk subscription %s: %s", sub.ID, resp.Status)
		return
	}
	if err := repository.MarkPushSubscriptionUsed(sub.Endpoint); err != nil {
		log.Printf("[PUSH] gagal update last_used_at %s: %v", sub.ID, err)
	}
}

func subscriber() string {
	if config.App == nil || strings.TrimSpace(config.App.VAPIDSubject) == "" {
		return "mailto:admin@netmon.local"
	}
	return config.App.VAPIDSubject
}
