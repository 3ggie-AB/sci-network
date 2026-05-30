package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
)

func CreateFeedback(userID string, req model.CreateFeedbackRequest) (*model.Feedback, error) {
	priority := req.Priority
	if priority == 0 {
		priority = 1
	}

	fb := &model.Feedback{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Status:      model.FeedbackStatusOpen,
		Priority:    priority,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := MySQL.Exec(`
		INSERT INTO feedbacks (id, user_id, title, description, category, status, priority, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		fb.ID, fb.UserID, fb.Title, fb.Description,
		fb.Category, fb.Status, fb.Priority, fb.CreatedAt, fb.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return fb, nil
}

func GetFeedbackByID(id string) (*model.Feedback, error) {
	fb := &model.Feedback{}
	err := MySQL.Get(fb, `
		SELECT f.*, u.username,
		       at.username AS assigned_to_name
		FROM feedbacks f
		LEFT JOIN users u ON u.id = f.user_id
		LEFT JOIN users at ON at.id = f.assigned_to
		WHERE f.id = ?`, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("feedback not found")
		}
		return nil, err
	}
	return fb, nil
}

func ListFeedbacks(page, limit int, userID string, role model.Role, status, category string) ([]model.Feedback, int, error) {
	offset := (page - 1) * limit
	var feedbacks []model.Feedback
	var total int

	baseWhere := `WHERE 1=1`
	args := []interface{}{}

	// Karyawan hanya bisa lihat feedback sendiri
	if role == model.RoleKaryawan {
		baseWhere += ` AND f.user_id = ?`
		args = append(args, userID)
	}

	if status != "" {
		baseWhere += ` AND f.status = ?`
		args = append(args, status)
	}
	if category != "" {
		baseWhere += ` AND f.category = ?`
		args = append(args, category)
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM feedbacks f %s`, baseWhere)
	err := MySQL.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	selectQuery := fmt.Sprintf(`
		SELECT f.*, u.username,
		       at.username AS assigned_to_name
		FROM feedbacks f
		LEFT JOIN users u ON u.id = f.user_id
		LEFT JOIN users at ON at.id = f.assigned_to
		%s
		ORDER BY f.priority DESC, f.created_at DESC
		LIMIT ? OFFSET ?`, baseWhere)

	args = append(args, limit, offset)
	err = MySQL.Select(&feedbacks, selectQuery, args...)
	return feedbacks, total, err
}

func UpdateFeedback(id string, req model.UpdateFeedbackRequest) (*model.Feedback, error) {
	setClauses := []string{"updated_at = ?"}
	args := []interface{}{time.Now()}

	if req.Status != "" {
		setClauses = append(setClauses, "status = ?")
		args = append(args, req.Status)
	}
	if req.AssignedTo != nil {
		setClauses = append(setClauses, "assigned_to = ?")
		args = append(args, *req.AssignedTo)
	}
	if req.Response != nil {
		setClauses = append(setClauses, "response = ?")
		args = append(args, *req.Response)
	}
	if req.Priority != nil {
		setClauses = append(setClauses, "priority = ?")
		args = append(args, *req.Priority)
	}

	query := fmt.Sprintf(`UPDATE feedbacks SET %s WHERE id = ?`,
		joinStrings(setClauses, ", "))
	args = append(args, id)

	_, err := MySQL.Exec(query, args...)
	if err != nil {
		return nil, err
	}
	return GetFeedbackByID(id)
}

func DeleteFeedback(id string) error {
	_, err := MySQL.Exec(`DELETE FROM feedbacks WHERE id = ?`, id)
	return err
}
