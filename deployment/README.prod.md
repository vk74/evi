<!--
Version: 1.0.0
Purpose: Production deployment quick-start for evi (Podman rootless + Quadlet + Caddy).
Deployment file: README.prod.md
Logic: Minimal steps to install prerequisites, configure env/secrets, and start the application.

Changes in v1.0.0:
- Initial quick-start including DNS and HTTPS /api routing
-->

## evi production deployment (quick start)

### 1) DNS (required for HTTPS)
- Create a DNS **A (IPv4)** and/or **AAAA (IPv6)** record for your domain (for example `evi.example.com`) pointing to your VM/host public IP.
- Ensure inbound ports **80/tcp** and **443/tcp** are open in your provider firewall.

### 2) Install prerequisites on the VM

```bash
./deployment/install.sh
```

### 3) Configure evi (edit templates)
- Edit:
  - `deployment/env/evi.template.env`
  - `deployment/env/evi.secrets.template.env`

Important:
- Set `EVI_DOMAIN` to your domain.
- Choose `EVI_TLS_MODE=letsencrypt` (automatic) or `EVI_TLS_MODE=manual` (your certificate).

### 4) Initialize and start

```bash
./deployment/evictl init
./deployment/evictl up
```

### 5) Access
- Frontend: `https://<your-domain>/`
- Backend API: `https://<your-domain>/api`


