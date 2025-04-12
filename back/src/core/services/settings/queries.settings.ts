/**
 * queries.settings.ts
 * SQL queries for settings management operations.
 */

interface SQLQuery {
  text: string;
}

interface SettingsQueries {
  getAllSettings: SQLQuery;
  getSettingByPath: SQLQuery;
  getSettingsBySection: SQLQuery;
}

export const queries: SettingsQueries = {
  // Get all settings
  getAllSettings: {
    text: `
      SELECT 
        sections_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        updated_at
      FROM app.app_settings
      ORDER BY sections_path, setting_name
    `
  },

  // Get single setting by full path and name
  getSettingByPath: {
    text: `
      SELECT 
        sections_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        updated_at
      FROM app.app_settings
      WHERE sections_path = $1
      AND setting_name = $2
      LIMIT 1
    `
  },

  // Get all settings in a section
  getSettingsBySection: {
    text: `
      SELECT 
        sections_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        updated_at
      FROM app.app_settings
      WHERE sections_path LIKE $1 || '%'
      ORDER BY sections_path, setting_name
    `
  }
};