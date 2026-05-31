package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourorg/netmon/internal/model"
	"golang.org/x/crypto/bcrypt"
)

// ─── User Repository ──────────────────────────────────────────────────────────

func CreateUser(req model.CreateUserRequest) (*model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		ID:        uuid.New().String(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hash),
		Role:      req.Role,
		FullName:  req.FullName,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	query := `INSERT INTO users (id, username, email, password, role, full_name, is_active, created_at, updated_at)
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err = MySQL.Exec(query,
		user.ID, user.Username, user.Email, user.Password,
		user.Role, user.FullName, user.IsActive, user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByID(id string) (*model.User, error) {
	return getUserByID(id, true)
}

func GetUserByIDAnyStatus(id string) (*model.User, error) {
	return getUserByID(id, false)
}

func getUserByID(id string, activeOnly bool) (*model.User, error) {
	user := &model.User{}
	query := `SELECT * FROM users WHERE id = ?`
	if activeOnly {
		query += ` AND is_active = 1`
	}
	err := MySQL.Get(user, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return user, nil
}

func GetUserByUsername(username string) (*model.User, error) {
	user := &model.User{}
	err := MySQL.Get(user, `SELECT * FROM users WHERE username = ?`, username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return user, nil
}

func GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	err := MySQL.Get(user, `SELECT * FROM users WHERE email = ?`, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return user, nil
}

func ListUsers(page, limit int, role string) ([]model.User, int, error) {
	offset := (page - 1) * limit
	var users []model.User
	var total int

	query := `SELECT * FROM users WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM users WHERE 1=1`
	args := []interface{}{}

	if role != "" {
		query += ` AND role = ?`
		countQuery += ` AND role = ?`
		args = append(args, role)
	}

	err := MySQL.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	err = MySQL.Select(&users, query, args...)
	return users, total, err
}

func UpdateUser(id string, req model.UpdateUserRequest) (*model.User, error) {
	setClauses := []string{"updated_at = ?"}
	args := []interface{}{time.Now()}

	if req.Email != "" {
		setClauses = append(setClauses, "email = ?")
		args = append(args, req.Email)
	}
	if req.FullName != "" {
		setClauses = append(setClauses, "full_name = ?")
		args = append(args, req.FullName)
	}
	if req.Role != "" {
		setClauses = append(setClauses, "role = ?")
		args = append(args, req.Role)
	}
	if req.IsActive != nil {
		setClauses = append(setClauses, "is_active = ?")
		args = append(args, *req.IsActive)
	}

	query := fmt.Sprintf(`UPDATE users SET %s WHERE id = ?`,
		joinStrings(setClauses, ", "))
	args = append(args, id)

	_, err := MySQL.Exec(query, args...)
	if err != nil {
		return nil, err
	}
	return GetUserByIDAnyStatus(id)
}

func DeleteUser(id string) error {
	_, err := MySQL.Exec(`UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?`, time.Now(), id)
	return err
}

func UserExistsByUsernameOrEmail(username, email string) (bool, error) {
	var count int
	err := MySQL.Get(&count, `SELECT COUNT(*) FROM users WHERE username = ? OR email = ?`, username, email)
	return count > 0, err
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
