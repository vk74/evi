package auth

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
	// Additional fields like deviceFingerprint can be added here
}

type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	User    *User  `json:"user,omitempty"`
}

type User struct {
	Username string `json:"username"`
	UUID     string `json:"uuid"`
}

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, LoginResponse{
			Success: false,
			Message: "Invalid request payload",
		})
	}

	if req.Username == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, LoginResponse{
			Success: false,
			Message: "Username and password are required",
		})
	}

	// Fetch user from DB
	ctx := context.Background()
	var userID, hashedPassword, accountStatus string
	
	err := h.DB.QueryRow(ctx, 
		"SELECT user_id, hashed_password, account_status FROM app.users WHERE username = $1", 
		req.Username,
	).Scan(&userID, &hashedPassword, &accountStatus)

	if err != nil {
		// User not found or DB error
		return c.JSON(http.StatusUnauthorized, LoginResponse{
			Success: false,
			Message: "Invalid credentials",
		})
	}

	// Check if account is active
	if accountStatus != "active" {
		return c.JSON(http.StatusForbidden, LoginResponse{
			Success: false,
			Message: "Account is disabled or requires action",
		})
	}

	// Verify password using bcrypt
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password))
	if err != nil {
		return c.JSON(http.StatusUnauthorized, LoginResponse{
			Success: false,
			Message: "Invalid credentials",
		})
	}

	// Password is correct!
	return c.JSON(http.StatusOK, LoginResponse{
		Success: true,
		User: &User{
			Username: req.Username,
			UUID:     userID,
		},
		// Tokens will be issued here in future implementation
	})
}
