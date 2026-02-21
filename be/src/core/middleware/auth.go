package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// Auth is a middleware that checks for a valid JWT token in the Authorization header.
func Auth(secretKey string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Missing Authorization header"})
			}

			// Typical header format: "Bearer <token>"
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Authorization header format"})
			}

			tokenStr := parts[1]

			// Parse and validate the token
			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				// Don't forget to validate the alg is what you expect
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok { // Or RSA if you use RS256
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				// Return the secret key used to sign the token
				return []byte(secretKey), nil
			})

			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid or expired token"})
			}

			// Extract claims and set them in the context for handlers to use
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				c.Set("user_id", claims["sub"]) // example: assuming user ID is in "sub"
			}

			return next(c)
		}
	}
}
