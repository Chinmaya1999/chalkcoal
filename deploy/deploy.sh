#!/usr/bin/env bash
# Runs on the server. Usage: deploy.sh <image-tag>
# Pulls the new image, restarts the stack, waits for a healthy API and rolls back automatically if it never gets healthy.
set -euo pipefail
cd /opt/chalkcoal
TAG=${1:?image tag required}
PREV=$(cat .current_tag 2>/dev/null || echo "")

export IMAGE_TAG=$TAG
echo "==> Deploying $TAG (previous: ${PREV:-none})"
docker compose pull app
# Keep a rolling set of database dumps (last 7) before touching anything
mkdir -p backups
if [ -n "$(docker compose ps -q mongo 2>/dev/null)" ]; then
  docker compose exec -T mongo sh -c 'mongodump -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db chalkcoal --archive --gzip' > "backups/chalkcoal-$(date +%Y%m%d-%H%M%S).gz" || echo "backup skipped"
  ls -1t backups/*.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
fi
docker compose up -d --remove-orphans

healthy() {
  for _ in $(seq 1 40); do
    s=$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || echo starting)
    [ "$s" = healthy ] && return 0
    sleep 3
  done
  return 1
}

if healthy && curl -fsS --max-time 10 -o /dev/null https://api.chalkcoal.com/api/health; then
  echo "$TAG" > .current_tag
  echo "==> Healthy. Deployed $TAG"
  docker image prune -af --filter "until=72h" >/dev/null 2>&1 || true
  exit 0
fi

echo "!! $TAG failed health checks"; docker compose logs --tail 60 app || true
if [ -n "$PREV" ]; then
  echo "==> Rolling back to $PREV"
  export IMAGE_TAG=$PREV
  docker compose up -d
fi
exit 1
