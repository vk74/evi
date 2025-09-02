/**
 * queries.catalog.services.ts - backend file
 * version: 1.0.0
 * 
 * Purpose: SQL queries for catalog services (public consumption layer)
 * Logic: Provides parameterized queries to fetch active services for the catalog and service details
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

  /**
   * Select service details for single service view
   * - Only services with status = 'in_production'
   * - Resolves usernames and group names for all role types
   * - Comprehensive service information for detailed display
   */
  getServiceDetails: `
    SELECT 
      s.id,
      s.name,
      s.priority,
      s.status,
      s.description_long,
      s.purpose,
      s.icon_name,
      s.created_at,
      u_owner.username AS owner,
      u_bowner.username AS backup_owner,
      u_tech.username AS technical_owner,
      u_btech.username AS backup_technical_owner,
      u_disp.username AS dispatcher,
      g_t1.group_name AS support_tier1,
      g_t2.group_name AS support_tier2,
      g_t3.group_name AS support_tier3
    FROM app.services s
    -- users
    LEFT JOIN app.service_users su_owner ON s.id = su_owner.service_id AND su_owner.role_type = 'owner'
    LEFT JOIN app.users u_owner ON su_owner.user_id = u_owner.user_id
    LEFT JOIN app.service_users su_bowner ON s.id = su_bowner.service_id AND su_bowner.role_type = 'backup_owner'
    LEFT JOIN app.users u_bowner ON su_bowner.user_id = u_bowner.user_id
    LEFT JOIN app.service_users su_tech ON s.id = su_tech.service_id AND su_tech.role_type = 'technical_owner'
    LEFT JOIN app.users u_tech ON su_tech.user_id = u_tech.user_id
    LEFT JOIN app.service_users su_btech ON s.id = su_btech.service_id AND su_btech.role_type = 'backup_technical_owner'
    LEFT JOIN app.users u_btech ON su_btech.user_id = u_btech.user_id
    LEFT JOIN app.service_users su_disp ON s.id = su_disp.service_id AND su_disp.role_type = 'dispatcher'
    LEFT JOIN app.users u_disp ON su_disp.user_id = u_disp.user_id
    -- groups
    LEFT JOIN app.service_groups sg_t1 ON s.id = sg_t1.service_id AND sg_t1.role_type = 'support_tier1'
    LEFT JOIN app.groups g_t1 ON sg_t1.group_id = g_t1.group_id
    LEFT JOIN app.service_groups sg_t2 ON s.id = sg_t2.service_id AND sg_t2.role_type = 'support_tier2'
    LEFT JOIN app.groups g_t2 ON sg_t2.group_id = g_t2.group_id
    LEFT JOIN app.service_groups sg_t3 ON s.id = sg_t3.service_id AND sg_t3.role_type = 'support_tier3'
    LEFT JOIN app.groups g_t3 ON sg_t3.group_id = g_t3.group_id
    WHERE s.id = $1 AND s.status = 'in_production'
  `,
};

export default queries;


