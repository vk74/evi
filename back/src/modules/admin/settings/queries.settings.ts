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
  updateSettingValue: SQLQuery;
}

export const queries: SettingsQueries = {
  // Get all settings
  getAllSettings: {
    text: `
      SELECT 
        section_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        is_public,
        updated_at
      FROM app.app_settings
      ORDER BY section_path, setting_name
    `
  },

  // Get single setting by full path and name
  getSettingByPath: {
    text: `
      SELECT 
        section_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        is_public,
        updated_at
      FROM app.app_settings
      WHERE section_path = $1
      AND setting_name = $2
      LIMIT 1
    `
  },

  // Get all settings in a section
  getSettingsBySection: {
    text: `
      SELECT 
        section_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        is_public,
        updated_at
      FROM app.app_settings
      WHERE section_path LIKE $1 || '%'
      ORDER BY section_path, setting_name
    `
  },

  // Update a single setting value
  updateSettingValue: {
    text: `
      UPDATE app.app_settings
      SET 
        value = $3::jsonb,
        updated_at = NOW()
      WHERE section_path = $1
      AND setting_name = $2
      RETURNING 
        section_path,
        setting_name,
        environment,
        value,
        validation_schema,
        default_value,
        confidentiality,
        description,
        is_public,
        updated_at
    `
  }
};