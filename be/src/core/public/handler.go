package public

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type PublicSetting struct {
	SectionPath string      `json:"section_path"`
	SettingName string      `json:"setting_name"`
	Value       interface{} `json:"value"`
	IsPublic    bool        `json:"is_public"`
}

type PublicSettingsResponse struct {
	Success  bool            `json:"success"`
	Settings []PublicSetting `json:"settings"`
	Error    string          `json:"error,omitempty"`
}

type Handler struct {
	DB *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) FetchPublicSettings(c echo.Context) error {
	ctx := context.Background()
	
	// Query app.app_settings for public and non-confidential settings
	rows, err := h.DB.Query(ctx, 
		`SELECT section_path, setting_name, value 
		 FROM app.app_settings 
		 WHERE is_public = true AND confidentiality = false`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, PublicSettingsResponse{
			Success:  false,
			Settings: []PublicSetting{},
			Error:    "Failed to fetch public settings",
		})
	}
	defer rows.Close()

	settings := make([]PublicSetting, 0)
	for rows.Next() {
		var s PublicSetting
		err := rows.Scan(&s.SectionPath, &s.SettingName, &s.Value)
		if err != nil {
			continue
		}
		s.IsPublic = true
		settings = append(settings, s)
	}

	return c.JSON(http.StatusOK, PublicSettingsResponse{
		Success:  true,
		Settings: settings,
	})
}
