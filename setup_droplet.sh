#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

wait_for_lock() {
    echo "Waiting for apt lock..."
    while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do
        sleep 5
    done
}

wait_for_lock
echo "--- 1. Updating System ---"
apt-get update
wait_for_lock
apt-get upgrade -y
wait_for_lock

echo "--- 2. Installing Dependencies ---"
apt-get install -y docker.io nginx certbot python3-certbot-nginx git ufw

echo "--- 3. Configuring Firewall ---"
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo "--- 4. Docker Setup ---"
systemctl start docker
systemctl enable docker

echo "--- 5. Setup Finished ---"
docker --version
nginx -v
