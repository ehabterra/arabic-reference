#!/usr/bin/env bash
# Launch the audio studio (scripts/tts/studio.py) — a local web UI to audition
# SILMA TTS, re-roll individual pronunciation clips, and accept takes into
# public/audio/ + manifest.json. Opens on http://localhost:7861/.
#
#   pnpm audio:studio            # or scripts/audio-studio.sh
#
# Same image/volumes as generate-audio.sh. Don't run both at once — they both
# write manifest.json. Ctrl-C stops the studio.
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE=silma-tts-lean
REF=scripts/tts/ar.ref.24k.wav

if [ ! -f "$REF" ]; then
  echo "Downloading reference voice sample..."
  curl -fsSL -o "$REF" \
    https://huggingface.co/spaces/silma-ai/silma-tts-v1-demo/resolve/main/ar.ref.24k.wav
fi

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Building $IMAGE image (one-time, big download)..."
  docker build -t "$IMAGE" scripts/tts
fi

docker run --rm -it \
  -p 127.0.0.1:7861:7861 \
  -v "$PWD":/repo \
  -v silma-hf-cache:/root/.cache \
  -e HF_HUB_DISABLE_PROGRESS_BARS=1 \
  "$IMAGE" python /repo/scripts/tts/studio.py
