#!/bin/bash
# Local deploy for the frontend: build → push to ECR → kubectl set image → wait rollout.
#
# Usage:
#   scripts/deploy.sh
#
# Env overrides:
#   AWS_REGION                (default: ap-northeast-2)
#   ECR_REGISTRY              (default: 749960970623.dkr.ecr.ap-northeast-2.amazonaws.com)
#   ECR_PREFIX                (default: vital-monitoring)
#   SERVICE                   (default: frontend)
#   K8S_NAMESPACE             (default: vital-monitoring)
#   K8S_DEPLOYMENT            (default: frontend)
#   PLATFORM                  (default: linux/amd64)
#   NEXT_PUBLIC_STREAM_URL    (default: https://a-vital-dev.asleep.ai)
#   NEXT_PUBLIC_INGEST_URL    (default: https://a-vital-dev.asleep.ai)
#   SKIP_BUILD=1              reuse the :dev tag already in ECR (only kubectl set image)

set -euo pipefail

cd "$(dirname "$0")/.."

AWS_REGION="${AWS_REGION:-ap-northeast-2}"
ECR_REGISTRY="${ECR_REGISTRY:-749960970623.dkr.ecr.ap-northeast-2.amazonaws.com}"
ECR_PREFIX="${ECR_PREFIX:-vital-monitoring}"
SERVICE="${SERVICE:-frontend}"
K8S_NAMESPACE="${K8S_NAMESPACE:-vital-monitoring}"
K8S_DEPLOYMENT="${K8S_DEPLOYMENT:-frontend}"
PLATFORM="${PLATFORM:-linux/amd64}"
NEXT_PUBLIC_STREAM_URL="${NEXT_PUBLIC_STREAM_URL:-https://a-vital-dev.asleep.ai}"
NEXT_PUBLIC_INGEST_URL="${NEXT_PUBLIC_INGEST_URL:-https://a-vital-dev.asleep.ai}"

GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "nogit")
TS=$(date +%Y%m%d-%H%M%S)
DIRTY=""
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  DIRTY="-dirty"
fi
TAG="${GIT_SHA}-${TS}${DIRTY}"
IMAGE="$ECR_REGISTRY/$ECR_PREFIX/$SERVICE"

echo "==> Region:     $AWS_REGION"
echo "==> Registry:   $ECR_REGISTRY/$ECR_PREFIX"
echo "==> Namespace:  $K8S_NAMESPACE"
echo "==> Deployment: $K8S_DEPLOYMENT"
echo "==> Tag:        $TAG"
echo "==> Platform:   $PLATFORM"
echo

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "==> ECR login"
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null

  echo "==> build + push ($PLATFORM)"
  docker buildx build \
    --platform "$PLATFORM" \
    --build-arg "NEXT_PUBLIC_STREAM_URL=${NEXT_PUBLIC_STREAM_URL}" \
    --build-arg "NEXT_PUBLIC_INGEST_URL=${NEXT_PUBLIC_INGEST_URL}" \
    -t "${IMAGE}:${TAG}" \
    -t "${IMAGE}:dev" \
    --push \
    -f Dockerfile \
    .
fi

ROLLOUT_TAG="$TAG"
if [ "${SKIP_BUILD:-0}" = "1" ]; then
  ROLLOUT_TAG="dev"
fi

echo
echo "==> kubectl context: $(kubectl config current-context)"
echo "==> set image deployment/$K8S_DEPLOYMENT $SERVICE=${IMAGE}:${ROLLOUT_TAG}"
kubectl set image "deployment/$K8S_DEPLOYMENT" \
  "${SERVICE}=${IMAGE}:${ROLLOUT_TAG}" \
  -n "$K8S_NAMESPACE"

echo "==> rollout status deployment/$K8S_DEPLOYMENT"
kubectl rollout status "deployment/$K8S_DEPLOYMENT" \
  -n "$K8S_NAMESPACE" --timeout=300s

echo
echo "==> Done. Pods:"
kubectl get pods -n "$K8S_NAMESPACE" -l app="$SERVICE" -o wide
