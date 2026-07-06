# CPU-only SILMA TTS runner for scripts/tts/generate.py — built and run by
# scripts/generate-audio.sh. A container because macOS can't install modern
# torch natively (no x86_64 wheels past 2.2), and because silma-tts's own pins
# (torchvision>=0.21, torchcodec) drag in the multi-GB CUDA stack on Linux too.
# So: install the dependencies generate.py actually exercises (read from the
# silma_tts source) with CPU wheels, then the package itself with --no-deps.
# torch/torchaudio 2.5 still decode audio without torchcodec.
FROM python:3.10-slim
# build-essential: nemo's cdifflib dep ships no wheel and compiles a C extension
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir torch==2.5.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir "numpy==1.26.4" soundfile tqdm cached_path hydra-core omegaconf \
    matplotlib pydub "transformers<5" vocos "nemo_text_processing==1.1.0" "catt_tashkeel==1.0.2" \
    "x_transformers>=1.31.14" ema_pytorch torchdiffeq safetensors unidecode click tomli librosa
RUN pip install --no-cache-dir --no-deps silma-tts
# Fail the build, not the run, if the dependency surgery broke an import.
RUN python -c "from silma_tts.api import SilmaTTS; print('silma_tts import OK')"
CMD ["python", "/repo/scripts/tts/generate.py"]
