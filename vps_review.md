# VPS Review

Reviewed on June 24, 2026. Follow-up changes are recorded below.

## Current state

- Host: `vps-15547724.vpsbr-15547724.vpshostgator.com.br`
- OS: Ubuntu 22.04.5 LTS
- Capacity: 2 CPUs, 4 GB RAM, 98 GB disk
- Swap: 4 GB persistent swap file
- Docker: installed and running
- Docker Compose: installed
- Repository: `/opt/elonew/elonew`
- Repository state: clean `main` branch at commit `55d7610`
- Application runtime: no containers, images, or Docker volumes
- Deployment configuration: production environment files are installed with mode `600`
- Frontend target: Vercel at `https://elonew.com.br`
- VPS API origin: `https://api.elonew.com.br`
- Prepared directories:
    - `/opt/elonew/apps`
    - `/opt/elonew/backups/postgres`
    - `/opt/elonew/infra`

## Existing strengths

- SSH uses public-key authentication.
- SSH password authentication is disabled.
- Root SSH login is disabled.
- Fail2ban is running.
- UFW is enabled.
- Docker uses AppArmor, seccomp, and cgroup v2.
- System time synchronization is active.
- Automatic Ubuntu upgrades are enabled.
- No failed systemd services were detected.
- The production Compose configuration keeps PostgreSQL and Redis on an internal network.
- PostgreSQL and Redis are not published directly on host ports.
- Public traffic is designed to enter through Cloudflare Tunnel.
- Container log rotation is already configured.
- Service health checks and ordered database migrations are already configured.

## Required improvements before deployment

### 1. Investigate port `1022` [x]

Port `1022` belonged to an orphaned Ubuntu release-upgrader SSH daemon. The
daemon was stopped and the port is closed. The primary SSH service remains
available on port `22022`.

### 2. Verify firewall and Fail2ban rules [x]

UFW defaults to denying incoming and routed traffic. Only SSH port `22022` is
allowed and listening; unused rules for ports `80` and `443` were removed
because Cloudflare Tunnel uses outbound connections.

Fail2ban now runs only the SSH jail for port `22022` and uses its UFW action.
The irrelevant Firewalld override and unused service jails were disabled.
Configuration validation passed after restart.

### 3. Configure production secrets [x]

The ignored production files were installed under
`infrastructure/docker/prod/` with mode `600`:

- `.env`
- `api.env`
- `web.env`
- `workers.env`

Secret presence and basic format checks passed, including the 32-byte order
credentials encryption key. Docker Compose configuration interpolation also
passed.

The public origins use Vercel for the frontend at `https://elonew.com.br` and
the VPS API through Cloudflare Tunnel at `https://api.elonew.com.br`.

### 4. Add PostgreSQL backups

The backup directory exists, but no backup job or backup files were found.

Before storing production data:

- schedule PostgreSQL backups;
- encrypt or otherwise protect backup contents;
- retain copies outside this VPS;
- define retention limits;
- test a complete restoration.

A backup that has not been restored successfully is not verified.

### 5. Add Redis persistence

The production Compose configuration does not give Redis a persistent volume.
BullMQ jobs may therefore be lost when the Redis container is recreated.

Add Redis persistence before relying on delayed or retryable production jobs.

### 6. Add swap [x]

A 4 GB `/swapfile` was created with mode `600`, activated, and added to
`/etc/fstab`. This reduces the risk of host builds failing from short memory
spikes. Swap remains a fallback, not a replacement for sufficient RAM.

### 7. Add operational monitoring

At minimum, monitor:

- application and API availability;
- container health and restart loops;
- disk usage;
- memory pressure;
- PostgreSQL backup success and age;
- TLS and Cloudflare Tunnel availability;
- failed migrations;
- worker queue failures.

Alerts should reach an operator outside the VPS.

### 8. Disable SSH X11 forwarding [x]

`X11Forwarding no` is configured in
`/etc/ssh/sshd_config.d/99-disable-x11.conf`. The SSH service remained active
after the change.

### 9. Restrict the VPS GitHub deploy key [x]

The `admin` account uses a repository-specific ED25519 deploy key identified as
`elonew-vps-git`. GitHub authentication identifies it with
`caiohenrqq/elonew`, repository fetch access succeeds, and a dry-run push is
explicitly rejected because the key is read-only.

### 10. Define repeatable deployment and rollback

The repository contains CI and production Compose commands, but no automated
deployment workflow was found.

Document or automate:

- selecting an immutable commit or image;
- pulling or building the release;
- running migrations;
- starting services;
- verifying health;
- viewing logs;
- rolling back application code;
- handling migrations that cannot be safely rolled back.

Avoid deploying an unspecified moving `main` checkout.

## Capacity assessment

This VPS is adequate for an initial small beta if PostgreSQL, Redis, API, web,
workers, and Cloudflare Tunnel share modest traffic.

The most likely constraint is memory during image builds. Build failures or
runtime memory pressure should be measured before increasing infrastructure.

## Recommended initial architecture

Keep the existing single-VPS Docker Compose and Cloudflare Tunnel design for the
first beta. It already matches the project's current scale and keeps database
services private.

Do not add Kubernetes, a second reverse proxy, or Terraform until operational
needs justify them.

## Deployment readiness

The host is a clean and suitable base, but it should not receive production
customer or payment data until the following are complete:

- unexpected public ports are resolved;
- firewall and Fail2ban rules are verified;
- production secrets are configured securely;
- PostgreSQL backup and restore are verified;
- Redis persistence is configured;
- monitoring and alerts are active;
- deployment and rollback procedures are documented and tested.
