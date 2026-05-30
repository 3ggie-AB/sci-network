package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/yourorg/netmon/config"
	"github.com/yourorg/netmon/internal/model"
	"github.com/yourorg/netmon/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID   string     `json:"user_id"`
	Username string     `json:"username"`
	Role     model.Role `json:"role"`
	jwt.RegisteredClaims
}

func Login(req model.LoginRequest) (*model.LoginResponse, error) {
	user, err := repository.GetUserByUsername(req.Username)
	if err != nil {
		return nil, errors.New("username atau password salah")
	}

	if !user.IsActive {
		return nil, errors.New("akun tidak aktif, hubungi administrator")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("username atau password salah")
	}

	token, err := GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{Token: token, User: *user}, nil
}

func Register(req model.RegisterRequest) (*model.User, error) {
	exists, err := repository.UserExistsByUsernameOrEmail(req.Username, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username atau email sudah digunakan")
	}

	// Default role for self-registration is karyawan
	return repository.CreateUser(model.CreateUserRequest{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
		FullName: req.FullName,
		Role:     model.RoleKaryawan,
	})
}

func GenerateToken(user *model.User) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "netmon",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}

func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.App.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("token tidak valid")
	}
	return claims, nil
}
