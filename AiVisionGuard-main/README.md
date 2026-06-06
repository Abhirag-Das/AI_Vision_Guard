# 🛡️ AivisionGuard - AI vs Real Media Authenticity Detector

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-black?logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

Advanced media authenticity detection system that distinguishes **AI-generated** vs **real** content using specialized deep learning models. Features premium UI with QR code sharing for instant social verification.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Dual-Model Detection** | • Images: EfficientNet B0 (`gradv5.pth`)<br>• Videos: EfficientNet V2 Small (`gradv6.pth`) |
| 💎 **Premium UI Theme** | Rich interface with vintage color palette & intuitive workflow |
| 📱 **QR Code Sharing** | Generate scannable QR codes linking to localhost analysis results for social sharing |
| ⚡ **Real-Time Analysis** | Instant classification with 30-second result badge display (no preview) |
| 🖼️ **Media-Type Enforcement** | Strict separation: images only in image sections, videos only in video sections |
| 🔊 **Audio Feedback** | Text-to-speech announcements for detection results (pyttsx3) |

---

## 🚀 Quick Start

### Prerequisites
- Windows 10/11
- Git + Git LFS ([install guide](https://git-lfs.com))
- Python 3.10+ ([download](https://python.org))

### Setup Instructions

```powershell
# 1. Clone repository (includes models via Git LFS)
git clone https://github.com/Abhirag-Das/AI_Vision_Guard.git
cd AivisionGuard

# 2. Install dependencies
python -m venv env
env\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Start server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
