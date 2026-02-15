# EVI README Version 0.10.12

# About

**EVI**  is containerized web application for building and managing products catalog. Users can browse products, configure them by selecting options and quantities, and generate cost estimations for their configurations. Administrators manage catalog, regional pricing, organizations, and application settings. More business scenarios planned for the future.


## Disclaimer

The software is provided "as is", without any warranties. Use at your own risk.

License will be available soon in the application menu: **About → License**.


## Host server requirements for evi deployment

To run evi, your physical server or virtual machine needs the following minimal specs:
- **RAM:** 3 GB
- **CPU:** 1 core (arm or amd64 processors)
- **Network:** 1 NIC
- **HDD** ~ 1.5 Gb SSD for containers environment
- **OS:** Compatible with Debian-based distributions: Ubuntu, Debian, Linux Mint, Pop!_OS, and other distros that use `apt-get`. **evi has been tested only on Ubuntu 24.04**. other listed distros are expected to work but formally were not tested.


## 🚀 Installation instructions

## 1. Clone the deploy scripts and files into evi directory 

Open terminal in your home directory, copy and paste the whole block of commands below (excluding ```bash ```) and hit enter

```bash
command -v git >/dev/null 2>&1 || { sudo apt-get update && sudo apt-get install -y git; }
git clone --filter=blob:none --sparse https://vk74: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@github.com/vk74/evi.git evi && cd evi
git sparse-checkout set deploy
(cd deploy && for f in * .[!.]* ..?*; do [ -e "$f" ] && mv "$f" ..; done)
mkdir backup updates
rmdir deploy
```


- evi directory is automatically created and populated with deployment files
- If your host server does not already have git, it will be installed (requires sudo) before cloning 


## 2. Start the installer

```bash
./install.sh
```

The installer will guide you through 3 installation steps: 
- install prerequisites on host server (requires sudo)
- guided configuration of container environment (does not require sudo)
- containers pool and deployment (does not require sudo)

The installer will deploy the following list of containers on your host server:
*   `evi-reverse-proxy`: Caddy (Reverse Proxy & TLS termination)
*   `evi-fe`: Frontend Nginx container
*   `evi-be`: Backend Node.js container
*   `evi-db`: PostgreSQL database container
*   `evi-pgadmin`: pgAdmin container for postgres DB administration

evi web application runs as a set of containers, or technically speaking **Rootless Podman Quadlets** (systemd services)/

**Installation complete**


------------------------------------------------


## General information and recommendations for preparing your server virtualization and containerization technology

## 🔐 Secrets Management

The application requires several secrets to function securely. These are stored in `/env/evi.secrets.env` which is created from `/env/evi.secrets.template.env` during evi installation.

*   `EVI_POSTGRES_PASSWORD`: Password for the database superuser (`postgres`).
*   `EVI_ADMIN_DB_PASSWORD`: Password for the admin user. Default admin account created during app installation is `evidba`. Has full DB access. Recommended for use in pgadmin console for manual admin operations.
*   `EVI_APP_DB_PASSWORD`: Password for the application user (`app_service`). Has limited access only to "app" DB schema in maindb database. Used in evi-be and evi-db containers for regular application operations like reading and writing values to/from `maindb` database. 
*   `EVI_JWT_PRIVATE_KEY`: RSA Private key or secure random string for token (jwt) signing.

## What is Containerization?
Containerization on Linux is an OS-level virtualization method that packages an application and its dependencies into isolated, portable containers. Unlike virtual machines, containers share the host OS kernel and provide process-level isolation. Each container has its own process tree, network stack, and filesystem.

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
* VT-x/AMD-V is NOT required for containers
* Standard Linux kernel is sufficient

Technology stack:
* Physical server → Linux OS → Podman containers

## Scenario 2: Containers Stack Running on Virtual Machine
Virtualization requirements:
* Virtualization needed at host level (L0) to run VM
* Guest VM (L1) runs Linux OS
* Containers inside VM still don't require virtualization
* Nested virtualization is not needed for containers

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

Note: you can manually deploy evi-db volume on separate disk on host server (this option will be implemented in future versions of installation workflow). This will limit space over-consumption and improve disk iops for the app.
