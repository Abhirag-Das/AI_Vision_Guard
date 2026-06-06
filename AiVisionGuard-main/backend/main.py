# backend/main.py

import torch
import shutil
from pathlib import Path
import cv2
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from torchvision import transforms as T

# === MODEL LOADER (inline for clarity) ===
import torch.nn as nn
import timm
from efficientnet_pytorch import EfficientNet

# Image Model: gardv5.pth (EfficientNet-B0)
class ImageGuard(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = EfficientNet.from_pretrained('efficientnet-b0')
        self.backbone._fc = nn.Identity()
        self.classifier = nn.Sequential(
            nn.Linear(1280, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 2)
        )
    def forward(self, x):
        return self.classifier(self.backbone(x))

# Video Model: gradv6.pth (EfficientNetV2-RW-S)
class VideoGuard(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model('efficientnetv2_rw_s', pretrained=False, num_classes=0)
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(1792, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, 2)
        )
    def forward(self, x):
        return self.classifier(self.backbone(x))

def load_image_model(path):
    model = ImageGuard()
    state_dict = torch.load(path, map_location="cpu")
    model.load_state_dict(state_dict)
    return model.eval()

def load_video_model(path):
    model = VideoGuard()
    state_dict = torch.load(path, map_location="cpu")
    model.load_state_dict(state_dict)
    return model.eval()

# === SETUP ===
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
IMAGE_MODEL_PATH = PROJECT_ROOT / "gardv5.pth"
VIDEO_MODEL_PATH = PROJECT_ROOT / "gradv6.pth"
UPLOAD_DIR = PROJECT_ROOT / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

image_model = load_image_model(str(IMAGE_MODEL_PATH))
video_model = load_video_model(str(VIDEO_MODEL_PATH))

app = FastAPI()
app.mount("/static", StaticFiles(directory=str(PROJECT_ROOT / "frontend")), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

def get_transform():
    return T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

def extract_first_frame(video_path, output_path):
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()
    if ret:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        Image.fromarray(frame_rgb).save(output_path)

# === ROUTES ===
@app.get("/")
async def home():
    return FileResponse(PROJECT_ROOT / "frontend" / "index.html")

@app.get("/image")
async def image_page():
    return FileResponse(PROJECT_ROOT / "frontend" / "image.html")

@app.get("/video")
async def video_page():
    return FileResponse(PROJECT_ROOT / "frontend" / "video.html")

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower()
    if ext not in {"jpg", "jpeg", "png"}:
        raise HTTPException(400, "Only images allowed")
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    transform = get_transform()
    img = Image.open(file_path).convert("RGB")
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        output = image_model(tensor)
        probs = torch.softmax(output, dim=1)
        ai_confidence = probs[0][0].item()
        result = "AI" if ai_confidence > 0.85 else "REAL"

    return {
        "result": result,
        "analyzed_image": f"uploads/{file_path.name}"
    }

@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1].lower()
    if ext not in {"mp4", "mov", "avi"}:
        raise HTTPException(400, "Only videos allowed")
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    frame_path = UPLOAD_DIR / f"{file_path.stem}_frame.jpg"
    extract_first_frame(str(file_path), str(frame_path))

    transform = get_transform()
    img = Image.open(frame_path).convert("RGB")
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        output = video_model(tensor)
        probs = torch.softmax(output, dim=1)
        ai_confidence = probs[0][1].item()
        result = "AI" if ai_confidence > 0.85 else "REAL"

    return {
        "result": result,
        "analyzed_image": f"uploads/{frame_path.name}"
    }

@app.get("/api/tts")
async def tts(label: str, reason: str = "generic"):
    import pyttsx3
    import tempfile
    text = "This looks AI-generated because details are too perfect." if label == "AI" \
        else "This seems real because I see natural texture and imperfections."
    engine = pyttsx3.init()
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as f:
        tmp = f.name
    engine.save_to_file(text, tmp)
    engine.runAndWait()
    return FileResponse(tmp, media_type="audio/wav", filename="explanation.wav")