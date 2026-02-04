# About

**EVI**  is a web application for building and managing products catalog. Users can browse products, configure them by selecting options and quantities, and generate cost estimations for their configurations. Administrators manage catalog sections, regional pricing, organizations, and application settings.

This directory holds the deploy tree of the evi repository: scripts, documentation and other files for evi installation, upgrades and admin operations. You place this content in a directory named **evi** on your server (for example, in your home directory). Release notes are in this directory (RELEASE_NOTES.md) and are used by install.sh when deploying a given version.


## Disclaimer

The software is provided "as is", without any warranties. Use at your own risk.

License and list of components are available in the application menu: **About → Components**.



## About the app and host server requirements

The app runs as a set of containers, or technically speaking **Rootless Podman Quadlets** (systemd services):
*   `evi-reverse-proxy`: Caddy (Reverse Proxy & TLS termination)
*   `evi-fe`: Frontend Nginx container
*   `evi-be`: Backend Node.js container
*   `evi-db`: PostgreSQL database container
*   `evi-pgadmin`: Optional pgadmin container, could be installed when user deploys prerequisites on host server

To run evi, your server or virtual machine needs the following specs:
- **RAM:** 4 GB
- **CPU:** 2 cores
- **Network:** 1 NIC, Ports **80** (HTTP) and **443** (HTTPS) open on the host
- **HDD** 600 - 900  Mb for all containers (depending on setup options) + extra space to store your app data
- **OS:** evi was tested on Ubuntu 24.04 LTS and should run on any Debian-based distro


## Installation instructions

## 1. Clone the deploy tree into directory evi

Clone only the **deploy** folder from the evi repository into a directory named **evi** in your home directory:

```bash
git clone --filter=blob:none --sparse https://vk74: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@github.com/vk74/evi.git evi && cd evi
git sparse-checkout set deploy
# Move deploy contents to current dir so ~/evi contains install.sh, evictl, env/, etc.
(cd deploy && for f in * .[!.]* ..?*; do [ -e "$f" ] && mv "$f" ..; done)
rmdir deploy
```

## 2. Make the scripts executable and start the installer

```bash
chmod +x install.sh evictl
./install.sh
```

The installer will guide you through 3 installation steps: 
- install prerequisites on host server (requires sudo)
- configure container environment, optionally add demo data (does not require sudo)
- containers deployment (does not require sudo)



## Admin operations after installation

When installation completes, run evictl for regular admin operations (status, restart, logs, updates, backups etc). 

```bash
cd evi
./evictl
```

Additionally you can install gui tool Cockpit for containers monitoring and operations. Cockpit is one of optional admin tools which could be installed by install.sh in the prerequisites step.



## General information and recommendations for preparing your server virtualization and containerization technology

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
