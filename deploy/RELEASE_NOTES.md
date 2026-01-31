# Release Notes

This file tracks application functionality and key changes for users following application development. It is used by install.sh when deploying a given version of evi.

## [0.9.12] - 2026-01-31

pre-MVP release.

### Added
- Initial pre-MVP release
- Core application functionality

### images
- ghcr.io/vk74/evi-db:0.9.12
- ghcr.io/vk74/evi-be:0.9.12
- ghcr.io/vk74/evi-fe:0.9.12

### deploy files
- deploy/.gitignore
- deploy/README.md
- deploy/RELEASE_NOTES.md
- deploy/db/demo-data/z_01_demo_catalog.sql
- deploy/db/migrations/m_001_future_migrations.sql
- deploy/env/evi.secrets.template.env
- deploy/env/evi.template.env
- deploy/evictl
- deploy/install.sh
- deploy/pgadmin/servers.json.template
- deploy/quadlet-templates/evi-be.container
- deploy/quadlet-templates/evi-db.container
- deploy/quadlet-templates/evi-db.volume
- deploy/quadlet-templates/evi-fe.container
- deploy/quadlet-templates/evi-pgadmin.container
- deploy/quadlet-templates/evi-reverse-proxy.container
- deploy/quadlet-templates/evi.network
- deploy/reverse-proxy/Caddyfile.site.letsencrypt.template
- deploy/reverse-proxy/Caddyfile.site.manual.template
- deploy/reverse-proxy/Caddyfile.template
- deploy/scripts/backup-create.sh
- deploy/scripts/backup-estimate.sh
- deploy/scripts/backup-restore.sh
- deploy/scripts/backup-verify.sh
- deploy/scripts/check-certificate.sh
- deploy/scripts/diagnose-ssl.sh
- deploy/scripts/gen-jwt-rs256-keypair.sh
- deploy/scripts/gen-self-signed-tls.sh
- deploy/scripts/import-tls.sh

### components (runtime)
- Caddy: 2.8-alpine
- pgAdmin: 8 (optional)
