#!/usr/bin/env bash
# Record pronunciation clips for every [data-speak] phrase in src/content into
# public/audio/ (wav + manifest.json), using SILMA TTS v1 in a local Docker
# container. See scripts/tts/generate.py for the how and why.
#
# Usage:
#   pnpm audio                 # generate whatever's missing (resumable)
#   scripts/generate-audio.sh  # same thing
#
# Re-record one phrase: delete its .wav from public/audio/ and rerun (the
# manifest heals itself). First run builds the image (~1.5 GB download) and
# fetches the model weights into the silma-hf-cache volume; later runs skip both.
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE=silma-tts-lean
REF=scripts/tts/ar.ref.24k.wav

# The reference voice sample (with its transcript hardcoded in generate.py)
# comes from SILMA's own demo space — fetched, not committed, to keep binary
# blobs out of the repo.
if [ ! -f "$REF" ]; then
  echo "Downloading reference voice sample..."
  curl -fsSL -o "$REF" \
    https://huggingface.co/spaces/silma-ai/silma-tts-v1-demo/resolve/main/ar.ref.24k.wav
fi

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Building $IMAGE image (one-time, big download)..."
  docker build -t "$IMAGE" scripts/tts
fi

# Command passed explicitly so the run doesn't depend on the image's CMD.
docker run --rm \
  -v "$PWD":/repo \
  -v silma-hf-cache:/root/.cache \
  -e HF_HUB_DISABLE_PROGRESS_BARS=1 \
  "$IMAGE" python /repo/scripts/tts/generate.py
