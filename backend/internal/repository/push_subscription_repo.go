package repository

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
)

func SavePushSubscription(userID string, req model.PushSubscriptionRequest, userAgent string) (*model.PushSubscription, error) {
	now := time.Now()
	sub := model.PushSubscription{
		ID:           uuid.New().String(),
		UserID:       userID,
		Endpoint:     req.Endpoint,
		EndpointHash: endpointHash(req.Endpoint),
		P256dh:       req.Keys.P256dh,
		Auth:         req.Keys.Auth,
		UserAgent:    userAgent,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	_, err := MySQL.Exec(`
		INSERT INTO push_subscriptions (
			id, user_id, endpoint, endpoint_hash, p256dh, auth, user_agent, created_at, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			user_id = VALUES(user_id),
			endpoint = VALUES(endpoint),
			p256dh = VALUES(p256dh),
			auth = VALUES(auth),
			user_agent = VALUES(user_agent),
			updated_at = VALUES(updated_at)`,
		sub.ID, sub.UserID, sub.Endpoint, sub.EndpointHash, sub.P256dh, sub.Auth,
		sub.UserAgent, sub.CreatedAt, sub.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return GetPushSubscriptionByEndpoint(req.Endpoint)
}

func GetPushSubscriptionByEndpoint(endpoint string) (*model.PushSubscription, error) {
	sub := &model.PushSubscription{}
	err := MySQL.Get(sub, `
		SELECT *
		FROM push_subscriptions
		WHERE endpoint_hash = ?`,
		endpointHash(endpoint),
	)
	return sub, err
}

func DeletePushSubscription(userID, endpoint string) error {
	result, err := MySQL.Exec(`
		DELETE FROM push_subscriptions
		WHERE user_id = ? AND endpoint_hash = ?`,
		userID, endpointHash(endpoint),
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("push subscription not found")
	}
	return nil
}

func DeletePushSubscriptionByEndpoint(endpoint string) error {
	_, err := MySQL.Exec(`
		DELETE FROM push_subscriptions
		WHERE endpoint_hash = ?`,
		endpointHash(endpoint),
	)
	return err
}

func ListPushSubscriptions() ([]model.PushSubscription, error) {
	var subs []model.PushSubscription
	err := MySQL.Select(&subs, `
		SELECT *
		FROM push_subscriptions
		ORDER BY updated_at DESC`,
	)
	return subs, err
}

func MarkPushSubscriptionUsed(endpoint string) error {
	now := time.Now()
	_, err := MySQL.Exec(`
		UPDATE push_subscriptions
		SET last_used_at = ?, updated_at = ?
		WHERE endpoint_hash = ?`,
		now, now, endpointHash(endpoint),
	)
	return err
}

func endpointHash(endpoint string) string {
	sum := sha256.Sum256([]byte(endpoint))
	return hex.EncodeToString(sum[:])
}
