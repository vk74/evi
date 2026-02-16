# evi Release Diary

Release observation log: artifacts, component versions, and participants. For compatibility map or analytics, JSON can be derived from this file later.

---
## 2026-02-17 | 0.11.1

**Scope:** 
availablecomponents:evi-fe,evi-be,evi-db,evi-reverse-proxy,evi-pgadmin,host
evi-fe,evi-be,evi-db

**Components:**

| Component | Version | Notes |
|-----------|---------|-------|
| evi-be | 0.11.1 | - |
| evi-db | 0.11.4 | PostgreSQL 17, schema 0.11.4 |
| evi-reverse-proxy | docker.io/caddy:2.8-alpine | - |
| evi-pgadmin | docker.io/dpage/pgadmin4:8 | - |

**Key dependencies:** Vue 3.5.21, Express 5.1.0, pg 8.18.0, PostgreSQL 17

**Notes:**
- new release 0.11.1 — vk74
- -updated controllers for use by express 5 — vk74
- test.release 0.10.6 — vk74

**Contributors:** 1 authors

---

## 2026-02-16 | 0.10.6

**Scope:** 
availablecomponents:evi-fe,evi-be,evi-db,evi-reverse-proxy,evi-pgadmin,host
evi-fe,evi-be,evi-db

**Components:**

| Component | Version | Notes |
|-----------|---------|-------|
| evi-be | 0.10.4 | - |
| evi-db | 0.11.3 | PostgreSQL 17, schema 0.11.3 |
| evi-reverse-proxy | docker.io/caddy:2.8-alpine | - |
| evi-pgadmin | docker.io/dpage/pgadmin4:8 | - |

**Key dependencies:** Vue 3.5.21, Express 4.18.2, pg 8.18.0, PostgreSQL 17

**Notes:**
- test.release 0.10.6 — vk74

**Contributors:** 1 authors

---

## 2026-02-16 | 0.10.5

**Scope:** 
availablecomponents:evi-fe,evi-be,evi-db,evi-reverse-proxy,evi-pgadmin,host
evi-db

**Components:**

| Component | Version | Notes |
|-----------|---------|-------|
| evi-be | 0.10.3 | - |
| evi-db | 0.11.2 | PostgreSQL 17, schema 0.11.2 |
| evi-reverse-proxy | docker.io/caddy:2.8-alpine | - |
| evi-pgadmin | docker.io/dpage/pgadmin4:8 | - |

**Key dependencies:** Vue 3.5.21, Express 4.18.2, pg 8.18.0, PostgreSQL 17

**Notes:**
- update application and database versions to 0.10.5 and 0.11.2 respectively; - upgrade PostgreSQL base image to version 18; - adjust environment configurations and documentation accordingly. — vk74
- Update region name validation to allow hyphen and underscore; version bump to 1.0.1 and 1.10.1 in backend and frontend respectively — vk74
- updated login form to login by enter key while cusros is still in the password field — vk74
- updated apply-update, download-update, check-update scripts to work with package.json file and to correctly handle errors and warnings — vk74
- updated deploy kit with check-download-update workflow and capability to update evi from cockpit (new panel) — vk74
- debugging of install.sh - guided reconfigure would not delete old ufw rules. step 4 — vk74
- debug install.sh - guided reconfigure delete old ufw cockpit rules — vk74
- dedug for installation and reinstallation workflows with ufw config and reconfig — vk74
- debug of install.sh - step 2 — vk74
- debugging for guided installation - step 1 — vk74
- micro updates to readme — vk74
- simplified readme.md — vk74
- Update install.sh with improvements to firewall rule management, ensuring removal of existing rules by number and adding separate rules for ports 9090 and 5445 for better clarity and configuration. — vk74
- Update install.sh for enhanced user experience with context-aware menu options, rename redeploy function to apply configuration, and introduce check-prerequisites.sh for diagnosing and repairing deployment prerequisites. — vk74
- Update backup-create.sh with enhanced README restore steps and fallback for EVI version retrieval; minor text improvements in install.sh notes. — vk74
- updated  release.sh sync versions to also update README.md version — vk74
- updated deploy kit to support evi directory split into runtime config and install/upgrade operations - updated backaup and restore procedures to use new directories — vk74
- updated readme.md for clone deploy directory from  open repo — vk74
- minor improvements for README.md — vk74
- updated root readme file — vk74
- Update release management scripts to include author information in commit messages and count contributors. — vk74
- updated release management script to write relese records into RELEASE_NOTES.md file: date, version, components, commit messages, list of contributors. — vk74
- reorganized release management script — vk74
- updated release script: deleted command to create local tags for containers and added github tag for release — vk74
- updated main README.MD file to reflect current process — vk74
- minor update and content rearrangement in ModuleComponents.vue — vk74
- release of evi-db 0.10.3 — vk74
- debugging for app.instance table. modified postgres_version handling to fit VARCHAR(20) and enhancing version placeholder management for independent replacements in release.sh. — vk74
- new release. update version numbers across package.json, SQL schema, and environment templates to reflect new releases (0.10.2 for DB, 0.10.3 for FE and BE). — vk74
- Update schema.sql treplacing app.app_version with app.instance for installation version tracking. Added new columns for enhanced tracking and modified INSERT/ON CONFLICT logic to accommodate the new structure. - Updated release.sh to synchronize version literals across components. — vk74
- Update release script to automating container version updates in ModuleComponents.vue. Added functions to extract Caddy and pgAdmin versions from environment template, enhancing version synchronization process. — vk74
- updated ModuleComponents..vue with container versions data — vk74
- improved uninstall behavior — vk74
- updated uninstall script behavior: upon successfull uninstall script exits to terminal home directory after user will press enter. if user cancels uninstall operation he will return back to install script. — vk74
- changed default admin password for new installations - standardized installation summary output in install.sh — vk74
- Enhance configuration summary in install.sh to display actual image:tag for 'latest' version choice instead of default template text. — vk74
- release of evi-be 0.10.2 - remove bug of multiple pricelist items editing by single item code — vk74
- updated uninstall evi function in install.sh - new release of evi-fe image, v.0.10.2. removed bug of multiple pricelist edits by changing single item — vk74
- Updateв install.sh to with new feature ещ ыудусе EVI version for installation. — vk74
- Refactor uninstall logic in install.sh to delegate to uninstall-evi.sh. Simplified the uninstall process by removing direct container, volume, and package management from the script, enhancing maintainability and clarity. — vk74
- Update install.sh with improvements in guided configuration and re-run logic. Renamed menu options for clarity, adjusted TLS certificate handling, and modified demo data deployment behavior to only allow during initial setup. — vk74
- updated install.sh re-run logic — vk74
- added uninstall evi option to install.sh — vk74
- micro correction in install.sh — vk74
- killed bug of same id update in pricelists admin module — vk74
- updated navigation inside on install.sh to redirect user to main menu after guided config — vk74
- updated backup / restore scripts to include firewall snapshot and rules - updated backup / restore scripts to restore pgadmin container ownership data and prevent crash loop — vk74
- updated restore readme file — vk74
- removed evictl from  /deploy directory - updated backup estimation logic to improve speed and acuracy of size and time estimations — vk74
- added "install from backup" function in install.sh — vk74
- updated backup estimation to provide a more precise values for time and size. — vk74
- update backup-create.sh for better reflection of progress - updated backup-create.sh for clear output message - updated backup-estimate.sh, resolved bug of estimation — vk74
- updated backup-create.sh — vk74
- cleaned up bugs in backup function in cockpit — vk74
- updated backup-create script in cockpit, evi admin tools — vk74
- updated evi admin tools backup form — vk74
- updated theming of evi tools in cockpit - updated evi backup form in cockpit — vk74
- Rename sidebar label from "pgAdmin (evi)" to "evi pgAdmin" for consistency. - Add evi admin tools panel to Cockpit sidebar with backup functionality. - Enhance theme synchronization in evi-pgadmin.js to detect dark/light themes. - Update index.html to use self-contained CSS and improve layout. — vk74
- Sync Cockpit theme with parent shell in evi-pgadmin.js and handle popup block detection. - Update index.html layout to use PatternFly styles, add popup-blocked hint, and improve user instructions for accessing pgAdmin. - improved installation summary in install.sh — vk74
- second attempt to shoot the bug with evi pgadmin link opening from cockpit. — vk74
- updated pgadmin (evi) link in cockpit — vk74
- Update evictl and install.sh: - removed interactive email prompt for pgAdmin setup, using hardcoded default login (evidba@pgadmin.app) instead. - added cockpit-evi-pgadmin package for sidebar integration in Cockpit, redirecting to pgAdmin. updated environment templates to reflect new default email configuration. — vk74
- updated install script to split first run guided setup and re-deploy guided setups. — vk74
- release v.0.10.1 (all containers) - updated release script — vk74
- updated evi redeply function via install.sh — vk74
- minor update to install.sh — vk74
- minor install.sh changes — vk74
- Update install.sh  with new firewall configuration options for Cockpit and pgAdmin access. Added guided setup step for specifying allowed IPs or CIDR ranges. Updated README.md to reflect changes in installation steps and firewall settings. Enhanced evi.template.env with new firewall access variables. — vk74
- more updates to install.sh — vk74
- a few more updates to install.sh — vk74
- minor updates of install script — vk74
- refactored install.sh to combine prerequisites in single step — vk74
- minimal interface formatting in evictl and install.sh — vk74
- updated evictl and install.sh to display script version at runtime — vk74
- removed restriction to limit pgadmin connections from localhost only — vk74
- enhanced estimation export with details column — vk74
- new release 0.9.15 — vk74
- minor correction to README.md — vk74
- corrected bug in demo data deployment — vk74
- added new debian-based distros as compatible with evi — vk74
- Update demo data  to include new products and pairs - added git installation command before git clone in installation step — vk74
- Remove demo data SQL file from deployment process to maintain single source of truth. Update prepare-deploy script to reflect changes in demo data handling. — vk74
- Implement cross-tab settings synchronization using BroadcastChannel in App.vue. This includes methods for broadcasting updates and applying remote changes from other tabs. — vk74
- Update demo data script enhancing catalog data for evi with regions, products, options, and price lists. Adjusted product relationships and added optional accessories for improved representation. — vk74
- Update public settings service replacing hardcoded settings with a dynamic filter for public settings. - Added database constraint to prevent confidential settings from being public - Updated frontend settings service to remove unnecessary console logs and aligning cache TTL values. — vk74
- updated software license placeholder (in info menu) — vk74
- updated "system components" component to include links to component sources and sections with components used in host os, reverse-proxy, admin tools. — vk74
- release 0.9.14 — vk74
- Update ModuleCatalog.vue to version 1.11.0, adding functionality to clear price cache on user location change and enhancing the watch on getUserLocation to ensure accurate product and price loading. — vk74
- updated demo data script for a more representative catalog data — vk74
- updated excel estimation generation helper — vk74
- Update README.md to include current container versions and modify the availability of license and components information. — vk74
- release 0.9.13 — vk74
- changes in release process to allow varying version numbers of containers — vk74
- Update service.axios.ts to version 1.2.0, enhancing security by ensuring the request interceptor checks user authentication status before attaching tokens. This prevents "zombie sessions" from sending requests when users are logged out. Additionally, improved handling of 401 errors to avoid auto-refreshing tokens for unauthenticated users. — vk74
- Update App.vue, adding visibility control for location selection menu item based on user authentication status. — vk74
- Refactor auth routes: added /api/auth/refresh to PUBLIC_ROUTES in fabric.events.ts to prevent unnecessary warnings user UUID warnings. — vk74
- 1. hardened security checks for UI operations, more isLoggin checks and token validations 2. improved app settings update service to restore original setting if backend returns error — vk74
- removed demo data script as it is not used in evi-db deploy workflow — vk74
- Update install.sh to restore the demo data question in guided setup. Update ModuleCatalog.vue - catalog loading logic for improved efficiency and handling user location changes more effectively. — vk74
- added create estimate (helper) function in product card — vk74
- debug - permissions would not be saved for authorized users in org management settings module — vk74
- Update demo catalog SQL script to version 1.0.8, renaming user groups to English, adding demo users, and adjusting product publication status. Update evictl script to display exit option first in the menu for improved navigation. — vk74
- Update evictl and install.sh scripts for version 1.7.2 and 1.8.0 respectively. Adjusted menu options for consistency by moving exit/back options to position 0. Removed demo data question from guided setup and updated confirmation prompt wording. — vk74
- Update build-dev.js to improve menu navigation and error handling. Adjust podman-compose-dev.yml to correct build context paths for database, backend, and frontend services. — vk74
- Update release.sh removing the "update release notes" option and reassigning menu options for improved navigation. Added detailed validation for individual component builds and cleanup processes. — vk74
- translation — vk74
- updated script for release process — vk74
- updated demo data script — vk74
- test release 0.9.12 — vk74
- updated images build procedure in release. — vk74
- second step of migration to remove evi-install repo. update of release process and deploy dir — vk74
- reverted github structure — vk74
- repo and path renamed — vk74

**Contributors:** 1 authors

---

## 2026-02-14 | 0.10.3

**Scope:** evi-fe,evi-be,evi-db

**Components:**

| Component | Version | Notes |
|-----------|---------|-------|
| evi-fe | 0.10.3 | - |
| evi-be | 0.10.3 | - |
| evi-db | 0.10.3 | PostgreSQL 17, schema 0.10.2 |

**Key dependencies:** Vue 3.5.21, Express 4.18.2, pg 8.11.3, PostgreSQL 17

**Notes:**
- updated release management script to write relese records into RELEASE_NOTES.md file: date, version, components, commit messages, list of contributors. — vk74
- reorganized release management script — vk74
- updated release script: deleted command to create local tags for containers and added github tag for release — vk74
- updated main README.MD file to reflect current process — vk74
- minor update and content rearrangement in ModuleComponents.vue — vk74
- release of evi-db 0.10.3 — vk74
- debugging for app.instance table. modified postgres_version handling to fit VARCHAR(20) and enhancing version placeholder management for independent replacements in release.sh. — vk74
- new release. update version numbers across package.json, SQL schema, and environment templates to reflect new releases (0.10.2 for DB, 0.10.3 for FE and BE). — vk74
- Update schema.sql treplacing app.app_version with app.instance for installation version tracking. Added new columns for enhanced tracking and modified INSERT/ON CONFLICT logic to accommodate the new structure. - Updated release.sh to synchronize version literals across components. — vk74
- Update release script to automating container version updates in ModuleComponents.vue. Added functions to extract Caddy and pgAdmin versions from environment template, enhancing version synchronization process. — vk74
- updated ModuleComponents..vue with container versions data — vk74
- improved uninstall behavior — vk74
- updated uninstall script behavior: upon successfull uninstall script exits to terminal home directory after user will press enter. if user cancels uninstall operation he will return back to install script. — vk74
- changed default admin password for new installations - standardized installation summary output in install.sh — vk74
- Enhance configuration summary in install.sh to display actual image:tag for 'latest' version choice instead of default template text. — vk74
- release of evi-be 0.10.2 - remove bug of multiple pricelist items editing by single item code — vk74
- updated uninstall evi function in install.sh - new release of evi-fe image, v.0.10.2. removed bug of multiple pricelist edits by changing single item — vk74
- Updateв install.sh to with new feature ещ ыудусе EVI version for installation. — vk74
- Refactor uninstall logic in install.sh to delegate to uninstall-evi.sh. Simplified the uninstall process by removing direct container, volume, and package management from the script, enhancing maintainability and clarity. — vk74
- Update install.sh with improvements in guided configuration and re-run logic. Renamed menu options for clarity, adjusted TLS certificate handling, and modified demo data deployment behavior to only allow during initial setup. — vk74
- updated install.sh re-run logic — vk74
- added uninstall evi option to install.sh — vk74
- micro correction in install.sh — vk74
- killed bug of same id update in pricelists admin module — vk74
- updated navigation inside on install.sh to redirect user to main menu after guided config — vk74
- updated backup / restore scripts to include firewall snapshot and rules - updated backup / restore scripts to restore pgadmin container ownership data and prevent crash loop — vk74
- updated restore readme file — vk74
- removed evictl from  /deploy directory - updated backup estimation logic to improve speed and acuracy of size and time estimations — vk74
- added "install from backup" function in install.sh — vk74
- updated backup estimation to provide a more precise values for time and size. — vk74
- update backup-create.sh for better reflection of progress - updated backup-create.sh for clear output message - updated backup-estimate.sh, resolved bug of estimation — vk74
- updated backup-create.sh — vk74
- cleaned up bugs in backup function in cockpit — vk74
- updated backup-create script in cockpit, evi admin tools — vk74
- updated evi admin tools backup form — vk74
- updated theming of evi tools in cockpit - updated evi backup form in cockpit — vk74
- Rename sidebar label from "pgAdmin (evi)" to "evi pgAdmin" for consistency. - Add evi admin tools panel to Cockpit sidebar with backup functionality. - Enhance theme synchronization in evi-pgadmin.js to detect dark/light themes. - Update index.html to use self-contained CSS and improve layout. — vk74
- Sync Cockpit theme with parent shell in evi-pgadmin.js and handle popup block detection. - Update index.html layout to use PatternFly styles, add popup-blocked hint, and improve user instructions for accessing pgAdmin. - improved installation summary in install.sh — vk74
- second attempt to shoot the bug with evi pgadmin link opening from cockpit. — vk74
- updated pgadmin (evi) link in cockpit — vk74
- Update evictl and install.sh: - removed interactive email prompt for pgAdmin setup, using hardcoded default login (evidba@pgadmin.app) instead. - added cockpit-evi-pgadmin package for sidebar integration in Cockpit, redirecting to pgAdmin. updated environment templates to reflect new default email configuration. — vk74
- updated install script to split first run guided setup and re-deploy guided setups. — vk74
- release v.0.10.1 (all containers) - updated release script — vk74
- updated evi redeply function via install.sh — vk74
- minor update to install.sh — vk74
- minor install.sh changes — vk74
- Update install.sh  with new firewall configuration options for Cockpit and pgAdmin access. Added guided setup step for specifying allowed IPs or CIDR ranges. Updated README.md to reflect changes in installation steps and firewall settings. Enhanced evi.template.env with new firewall access variables. — vk74
- more updates to install.sh — vk74
- a few more updates to install.sh — vk74
- minor updates of install script — vk74
- refactored install.sh to combine prerequisites in single step — vk74
- minimal interface formatting in evictl and install.sh — vk74
- updated evictl and install.sh to display script version at runtime — vk74
- removed restriction to limit pgadmin connections from localhost only — vk74
- enhanced estimation export with details column — vk74
- new release 0.9.15 — vk74
- minor correction to README.md — vk74
- corrected bug in demo data deployment — vk74
- added new debian-based distros as compatible with evi — vk74
- Update demo data  to include new products and pairs - added git installation command before git clone in installation step — vk74
- Remove demo data SQL file from deployment process to maintain single source of truth. Update prepare-deploy script to reflect changes in demo data handling. — vk74
- Implement cross-tab settings synchronization using BroadcastChannel in App.vue. This includes methods for broadcasting updates and applying remote changes from other tabs. — vk74
- Update demo data script enhancing catalog data for evi with regions, products, options, and price lists. Adjusted product relationships and added optional accessories for improved representation. — vk74
- Update public settings service replacing hardcoded settings with a dynamic filter for public settings. - Added database constraint to prevent confidential settings from being public - Updated frontend settings service to remove unnecessary console logs and aligning cache TTL values. — vk74
- updated software license placeholder (in info menu) — vk74
- updated "system components" component to include links to component sources and sections with components used in host os, reverse-proxy, admin tools. — vk74
- release 0.9.14 — vk74
- Update ModuleCatalog.vue to version 1.11.0, adding functionality to clear price cache on user location change and enhancing the watch on getUserLocation to ensure accurate product and price loading. — vk74
- updated demo data script for a more representative catalog data — vk74
- updated excel estimation generation helper — vk74
- Update README.md to include current container versions and modify the availability of license and components information. — vk74
- release 0.9.13 — vk74
- changes in release process to allow varying version numbers of containers — vk74
- Update service.axios.ts to version 1.2.0, enhancing security by ensuring the request interceptor checks user authentication status before attaching tokens. This prevents "zombie sessions" from sending requests when users are logged out. Additionally, improved handling of 401 errors to avoid auto-refreshing tokens for unauthenticated users. — vk74
- Update App.vue, adding visibility control for location selection menu item based on user authentication status. — vk74
- Refactor auth routes: added /api/auth/refresh to PUBLIC_ROUTES in fabric.events.ts to prevent unnecessary warnings user UUID warnings. — vk74
- 1. hardened security checks for UI operations, more isLoggin checks and token validations 2. improved app settings update service to restore original setting if backend returns error — vk74
- removed demo data script as it is not used in evi-db deploy workflow — vk74
- Update install.sh to restore the demo data question in guided setup. Update ModuleCatalog.vue - catalog loading logic for improved efficiency and handling user location changes more effectively. — vk74
- added create estimate (helper) function in product card — vk74
- debug - permissions would not be saved for authorized users in org management settings module — vk74
- Update demo catalog SQL script to version 1.0.8, renaming user groups to English, adding demo users, and adjusting product publication status. Update evictl script to display exit option first in the menu for improved navigation. — vk74
- Update evictl and install.sh scripts for version 1.7.2 and 1.8.0 respectively. Adjusted menu options for consistency by moving exit/back options to position 0. Removed demo data question from guided setup and updated confirmation prompt wording. — vk74
- Update build-dev.js to improve menu navigation and error handling. Adjust podman-compose-dev.yml to correct build context paths for database, backend, and frontend services. — vk74
- Update release.sh removing the "update release notes" option and reassigning menu options for improved navigation. Added detailed validation for individual component builds and cleanup processes. — vk74
- translation — vk74
- updated script for release process — vk74
- updated demo data script — vk74
- test release 0.9.12 — vk74
- updated images build procedure in release. — vk74
- second step of migration to remove evi-install repo. update of release process and deploy dir — vk74
- reverted github structure — vk74
- repo and path renamed — vk74

**Contributors:** 1 authors

---


