#!/bin/bash
IMAGE="registry.digitalocean.com/inventory-ballet-reg/inventory-app:latest"
TOKEN="$DO_TOKEN"
# Usage: DO_TOKEN=xxxx ./deploy.sh
if [ -z "$TOKEN" ]; then
    echo "Error: DO_TOKEN environment variable not set."
    exit 1
fi


echo "--- 1. Login to Registry ---"
echo "$TOKEN" | docker login registry.digitalocean.com -u dgm@zuse.lk --password-stdin

echo "--- 2. Preparing Port 80 ---"
# Stop host nginx to free up port 80 for the container
service nginx stop
systemctl disable nginx
# Ensure no process is using port 80
fuser -k 80/tcp || true

echo "--- 3. Deploying Container ---"
docker pull $IMAGE
docker stop inventory-app || true
docker rm inventory-app || true

docker run -d \
  --name inventory-app \
  --restart unless-stopped \
  -p 80:80 \
  $IMAGE

echo "--- 4. Verification ---"
docker ps
curl -I localhost
