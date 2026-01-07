# evi

**evi** is a containerized application stack managed by rootless Podman. This repository contains the source code for the Backend (Express/Node.js), Frontend (Vue.js), and Database (PostgreSQL) configurations.

---

## 🚀 Production Deployment (Quick Start)

This guide assumes you are deploying to a fresh **Ubuntu 24.04** server.

### 1. Prerequisites

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **OS** | Ubuntu 24.04 LTS | Preferred for latest kernel/Podman support. |
| **CPU** | 2 vCPU | Minimum. |
| **RAM** | 4 GB | Minimum recommended for stable DB/Node operation. |
| **Disk** | 20 GB | For OS, Images, and Database volume. |
| **Network**| Public IP | Ports `80/tcp` (HTTP) and `443/tcp` (HTTPS) must be open. |
| **DNS** | A-Record | Point your domain (e.g., `evi.example.com`) to the server IP. |

### 2. Installation (The "Happy Path")

Connect to your server via SSH and follow these steps:

#### Step 1: Get the Code
Clone the repository to your home directory.
*(Note: If the repo is private, you will need to use an SSH Deploy Key or Personal Access Token)*

```bash
cd ~
git clone <YOUR_REPO_URL> evi
cd evi/deployment
```

#### Step 2: Run the Installer
Launch the interactive installer wizard.

```bash
./install.sh
```

**Inside the Installer Menu:**
1.  Select **1) Prerequisites** -> **Install Dependencies**.
    *   *This installs Podman, curl, openssl and configures system settings.*
2.  Select **2) Configuration & Secrets** -> **Run Setup Wizard**.
    *   *This will create your `.env` files.*
    *   *Select **"Yes"** to Auto-generate secure passwords/keys.*
    *   *Important: You may need to edit `deployment/env/evi.env` manually if you need to set a specific Domain Name (defaults to IP mode if unchanged).*
3.  Select **3) Deployment Operations** -> **Init & Start**.
    *   *This builds the containers and starts the application stack.*

#### Step 3: Verify
Open your browser and navigate to:
*   `https://<YOUR_DOMAIN>` (or `http://<YOUR_IP>` if no domain configured yet)

---

## 🔐 Secrets Management

The application requires several secrets to function securely. These are stored in `deployment/env/evi.secrets.env`.

**The installer can auto-generate these for you.** If you prefer to set them manually:

1.  Copy the template: `cp deployment/env/evi.secrets.template.env deployment/env/evi.secrets.env`
2.  Edit the file:
    *   `EVI_POSTGRES_PASSWORD`: Strong password for the database superuser (`postgres`).
    *   `EVI_ADMIN_DB_PASSWORD`: Strong password for the admin user (`admin`).
    *   `EVI_APP_DB_PASSWORD`: Strong password for the application user (`app_service`).
    *   `EVI_JWT_PRIVATE_KEY`: RSA Private key or secure random string for token signing.

*Never commit `evi.secrets.env` to version control.*

---

## 🕹️ Operations (evictl)

Day-to-day management is handled by the `evictl` tool.

```bash
cd ~/evi/deployment
./evictl
```

Running it without arguments opens an **Interactive Menu**. You can also use subcommands:

| Command | Description |
|---------|-------------|
| `./evictl up` | Start all services (Systemd/Podman). |
| `./evictl down` | Stop all services. |
| `./evictl restart` | Restart all services. |
| `./evictl status` | Show status of containers. |
| `./evictl logs` | Tail logs (defaults to proxy). |
| `./evictl update` | Pull latest images and restart. |

---

## 🛠 Development

For local development instructions, see the specific README files in the subdirectories:
*   [Backend Documentation](back/README.md)
*   [Frontend Documentation](front/README.md)

### Deployment Architecture
The stack runs as a set of **Rootless Podman Quadlets** (systemd services):
*   `evi-proxy`: Caddy (Reverse Proxy & TLS termination)
*   `evi-fe`: Frontend Nginx container
*   `evi-be`: Backend Node.js container
*   `evi-db`: PostgreSQL 17 container

All artifacts are managed in `~/evi`.

