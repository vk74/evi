**evi** is a containerized application stack hosted using Podman application. This README contains short instruction for evi deployment on your server. More usefull information for your server preparation and operations could be found in the end of this file. This manual and install script assumes that all containers will be hosted on the same linux server. 

---

## 🚀 Production Deployment (Quick Start)

This guide assumes you are deploying to a fresh **Ubuntu 24.04** server.

### 1. Prerequisites. 
Prepare the following hardware server or a VM:

| Component | Requirement       | Notes                                                                 |
|-----------|-------------------|-----------------------------------------------------------------------|
| OS        | Ubuntu 24.04 LTS  | Run on physical computer or VM                                        |
| CPU       | 2 CPU cores       | Minimum                                                               |
| RAM       | 4 GB              | Minimum recommended for stable DB/Node operation                      |
| Disk      | 20 GB             | For OS, Images, and Database volume                                   |
| Network   | 1 Gbit/s          | Ports `80/tcp` (HTTP) and `443/tcp` (HTTPS) must be opened on host    |

### 2. Installation (The "Happy Path")

Open terminal or connect to your server via SSH and follow these steps:

#### Step 1: Get a copy of source code
Clone the repository to your home directory.

```bash
sudo apt install git
cd ~
git clone https://vk74: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@github.com/vk74/evi.git ~/evi
cd evi/deployment
```

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
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

#### Step 2: Run the Installer
Launch the interactive installer wizard.

```bash
cd ~/evi/deployment
chmod +x install.sh evictl
./install.sh
```
the script will help you to: 
1. install containerization prerequisites 
2. pre-configure your server to host container environment 
3. deploy containers with application components

#### Step 3: Verify

**Application:**
*   Open `https://<YOUR_DOMAIN>` (or `http://<YOUR_IP>`)

**Management GUI (if installed):**
*   Open `https://<YOUR_IP>:9090`
*   Log in with your system user (e.g. `vit`) and password.
*   Navigate to the **Podman Containers** tab.

---

## 🔐 Secrets Management

The application requires several secrets to function securely. These are stored in `deployment/env/evi.secrets.env`.

*   `EVI_POSTGRES_PASSWORD`: Strong password for the database superuser (`postgres`).
*   `EVI_ADMIN_DB_PASSWORD`: Strong password for the admin user. Default admin account created during app installation is `evidba`. Has full DB access. Recommended for use in pgadmin console for admin operations.
*   `EVI_APP_DB_PASSWORD`: Strong password for the application user (`app_service`). Has limited access only to "app" DB schema in maindb database. Used in evi-be and evi-db containers for regular application operations like reading and writing values to/from database. 
*   `EVI_JWT_PRIVATE_KEY`: RSA Private key or secure random string for token (jwt) signing.

Never commit `evi.secrets.env` to version control.

---

## 🕹️ Operations (evictl)

Day-to-day management is handled by the `evictl` tool.

```bash
cd ~/evi/deployment
./evictl
```

Running evictl without arguments opens an **Interactive Menu** which lets you to manage containers and host environment

### Deployment Architecture
The stack runs as a set of **Rootless Podman Quadlets** (systemd services):
*   `evi-reverse-proxy`: Caddy (Reverse Proxy & TLS termination)
*   `evi-fe`: Frontend Nginx container
*   `evi-be`: Backend Node.js container
*   `evi-db`: PostgreSQL database container
*   `evi-pgadmin`: Optional pgadmin container, is installed when user deploys admin tools on host server

---

# General information and recommendations for preparing your server virtualization and containerization technology

## What is Containerization?
Containerization on Linux is an OS-level virtualization method that packages an application and its dependencies into isolated, portable containers. Unlike VMs, containers share the host OS kernel and provide process-level isolation. Each container has its own process tree, network stack, and filesystem.

## Linux Kernel Container Features:
* Namespaces — isolate processes, network, filesystem, users, IPC, and hostname
* Control Groups (cgroups) — limit and monitor CPU, memory, disk I/O, network resources
* Union Filesystems — layer-based image storage (overlay, aufs)

## Scenario 1: Containers Stack Running on Physical Host
Virtualization requirements:
* No virtualization needed for container runtime (Podman)
* Containers use Linux kernel features (namespaces, cgroups)
* Direct hardware access through host kernel
* No hypervisor or VM layer required

CPU requirements:
* Any modern x86_64 CPU
* VT-x/AMD-V NOT required for containers
* Standard Linux kernel is sufficient

Technology stack:
* Physical server → Linux OS → Podman containers

## Scenario 2: Containers Stack Running on Virtual Machine
Virtualization requirements:
* Virtualization needed at host level (L0) to run VM
* Guest VM (L1) runs Linux OS
* Containers inside VM still don't require virtualization
* Nested virtualization not needed for containers

CPU requirements:
* Host CPU: VT-x (Intel) or AMD-V (AMD) required
* Guest VM gets virtualized CPU, but containers use guest kernel directly
* Standard virtualization support sufficient (no nested features needed)

Technology stack:
* Physical server → Hypervisor (VMware/KVM) → Linux VM → Podman containers
* Two layers: VM layer (virtualization) + container layer (no virtualization) 

## Recommended Filesystems for Host Servers

* XFS
Best for: production, large files, high throughput, quota enforcement
Features: project quotas (pquota), requires ftype=1 for OverlayFS
Limitations: quota setup more complex than ext4

* ext4
Best for: general use, small files, standard deployments
Features: universal support, stable, simple setup
Limitations: no Docker --storage-opt size= enforcement with overlay2

* BTRFS
Best for: snapshots, advanced storage features, thin provisioning
Features: native snapshots, COW, compression, checksums, qgroup quotas
Limitations: higher overhead, complexity, requires balancing; quota support only with BTRFS storage driver

## Container Volume Quota Support
XFS: project quotas (pquota) — full Docker/Podman enforcement supported
ext4: project quotas (prjquota) — manual quotas only, no quota enforcement
BTRFS: qgroup quotas — only with Btrfs storage driver (not overlay2)

---

# Backup and Disaster Recovery Strategy

## Overview
evi-db (PostgreSQL container) is the only stateful component in the evi stack. The volume evi_db_data:/var/lib/postgresql/data stores all application data (users, products, settings, etc.). Other containers (evi-be, evi-fe, evi-reverse-proxy) are stateless and can be recreated from images or rebuilt from source code.

## Backup Strategy

Backup the following files once (after deployment completes):
1. CRITICAL: deployment/env/evi.secrets.env — contains database passwords that cannot be recreated. Without it, you cannot connect to the restored database with the correct passwords.
2. CRITICAL: ${HOME}/.local/share/evi/secrets/jwt_private_key.pem — required if EVI_JWT_GENERATE_KEY=true. Without it, all existing JWT tokens become invalid after restoration (users will need to re-login, otherwise can be recreated).
3. RECOMMENDED: deployment/env/evi.env — can be recreated manually, but backup simplifies configuration restoration.
4. CONDITIONAL: deployment/env/tls/ — only if EVI_TLS_MODE=manual and using custom certificates. Not needed for Let's Encrypt (certificates auto-renew).

Backup the following daily:
1. evi-db volume (PostgreSQL data)
    * Method: Use pg_dump for logical backups (recommended for regular backups)
    * Frequency: Daily backups at off-peak hours (e.g., 02:00)
    * Storage: Store backups on separate storage or remote location (NFS, S3, or external disk)


## Disaster Recovery Process

1. Restore configuration files:
    * Restore deployment/env/evi.secrets.env
    * Restore deployment/env/evi.env (or recreate manually)
    * Restore ${HOME}/.local/share/evi/secrets/jwt_private_key.pem (if auto-generated)
    * Restore deployment/env/tls/ (only if manual TLS mode with custom certificates)
2. Regenerate systemd services and secrets by using evictl:
   cd ~/evi/deployment   
   ./evictl init
This recreates quadlet files, podman secrets, and Caddyfile.
3. Restore evi-db volume:
    Option A (pg_dump restore): Create new volume, restore from SQL dump
    Option B (volume-level restore): Restore volume filesystem from backup
4. Restart all containers:
   # Start DB first
   systemctl --user start evi-db.service     
   # Wait for DB to be ready   
   systemctl --user start evi-be.service evi-fe.service evi-reverse-proxy.service
5. Verify: Application should be fully operational with restored data.

## Key Points on Backup and Disaster Recovery
* Single point of backup: Only evi-db volume needs regular backups
* Simple recovery: Restore volume and restart containers to fully restore the application
* No data loss in other containers: evi-be, evi-fe, evi-reverse-proxy contain no persistent application data
* Backup timing: PostgreSQL supports hot backups — container can remain running during pg_dump

## Best Practices
* Test restore procedures regularly — verify backups are restorable
* Monitor backup completion — ensure backups run successfully
* Store backups off-host — protect against host hardware failure
* Document credentials — ensure access to deployment/env/evi.secrets.env for restore