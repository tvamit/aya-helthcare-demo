# Installation Guide - Python Services

## Disk Space Issue

PyTorch with CUDA support is very large (~800MB+). If you're running out of disk space, use the CPU-only version.

## Option 1: CPU-Only PyTorch (Recommended for Limited Space)

```bash
cd python-services
source venv/bin/activate  # Activate your venv
pip install flask==3.0.0 numpy>=1.24.0
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install openai-whisper==20231117
```

This installs CPU-only PyTorch (~150MB instead of ~800MB).

## Option 2: Full Installation (If You Have Space)

```bash
cd python-services
source venv/bin/activate
pip install -r requirements.txt
```

## Option 3: Use Faster-Whisper (Lightweight Alternative)

If you still have space issues, you can use `faster-whisper` which is lighter:

```bash
cd python-services
source venv/bin/activate
pip install flask==3.0.0
pip install faster-whisper
```

Then update `stt_service.py` to use faster-whisper instead of openai-whisper.

## Check Disk Space

```bash
df -h
```

You need at least **2GB free space** for full installation, or **500MB** for CPU-only.

## After Installation

Start services:

```bash
python3 start_services.py
```
