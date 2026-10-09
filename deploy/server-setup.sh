#!/usr/bin/env bash
# One-time (idempotent) bootstrap of an Amazon Linux 2023 host for Chalk&Coal. Run as root: sudo bash server-setup.sh
set -euo pipefail

APP_DIR=/opt/chalkcoal
DEPLOY_USER=${DEPLOY_USER:-ec2-user}

echo "==> System updates + base packages"
dnf -y update --security || true
dnf -y install docker git jq dnf-automatic

echo "==> Docker + compose plugin"
systemctl enable --now docker
if ! docker compose version >/dev/null 2>&1; then
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi
usermod -aG docker "$DEPLOY_USER"
cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true,
  "no-new-privileges": true
}
JSON
systemctl restart docker

echo "==> 2 GB swap (the instance has < 1 GB RAM)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -w vm.swappiness=20 >/dev/null
echo 'vm.swappiness=20' > /etc/sysctl.d/99-swap.conf

echo "==> Automatic security updates"
sed -i 's/^apply_updates.*/apply_updates = yes/; s/^upgrade_type.*/upgrade_type = security/' /etc/dnf/automatic.conf
systemctl enable --now dnf-automatic.timer

echo "==> SSH hardening (key-only, no root)"
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'SSH'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
MaxAuthTries 3
X11Forwarding no
SSH
sshd -t && systemctl reload sshd

echo "==> App directory"
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

echo "Bootstrap done."
