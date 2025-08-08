/**
 * queries.catalog.services.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: SQL queries for catalog services (public consumption layer)
 * Logic: Provides parameterized queries to fetch active services for the catalog
 * File type: Backend TypeScript (queries.catalog.services.ts)
 */

export const queries = {
  /**
   * Select active services for catalog consumption
   * - Only services with status = 'in_production'
   * - Minimal set of fields required for service cards
   * - Owner username is optional and resolved via joins
   */
  getActiveServices: `
    SELECT 
      s.id,
      s.name,
      s.priority,
      s.status,
      s.description_short,
      s.icon_name,
      u.username AS owner
    FROM app.services s
    LEFT JOIN app.service_users su 
      ON s.id = su.service_id AND su.role_type = 'owner'
    LEFT JOIN app.users u 
      ON su.user_id = u.user_id
    WHERE s.status = 'in_production'
    ORDER BY s.name ASC
  `,

  /**
   * Select active services by section for catalog consumption
   * - Only services with status = 'in_production'
   * - Joined with app.section_services for filtering and ordering
   */
  getActiveServicesBySection: `
    SELECT 
      s.id,
      s.name,
      s.priority,
      s.status,
      s.description_short,
      s.icon_name,
      u.username AS owner,
      ss.service_order
    FROM app.section_services ss
    JOIN app.services s ON ss.service_id = s.id
    LEFT JOIN app.service_users su 
      ON s.id = su.service_id AND su.role_type = 'owner'
    LEFT JOIN app.users u 
      ON su.user_id = u.user_id
    WHERE s.status = 'in_production' AND ss.section_id = $1
    ORDER BY ss.service_order ASC, s.name ASC
  `,
};

export default queries;


