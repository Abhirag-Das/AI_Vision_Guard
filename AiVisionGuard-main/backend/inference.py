# backend/inference.py

from PIL import Image
import torchvision.transforms as T
import torch
import numpy as np

def preprocess_image(image_path: str):
    transform = T.Compose([
        T.Resize((224, 224)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    img = Image.open(image_path).convert("RGB")
    return transform(img).unsqueeze(0)

def analyze_image_heuristics(image_path: str):
    """Very simple heuristics to make TTS slightly smarter."""
    img = Image.open(image_path).convert("L")  # grayscale
    img_np = np.array(img)

    # Rough estimate of "smoothness" (AI tends to be smoother)
    laplacian_var = cv2.Laplacian(img_np, cv2.CV_64F).var()
    is_smooth = laplacian_var < 100  # threshold tuned roughly

    # Dominant color variance
    color_img = np.array(Image.open(image_path).convert("RGB"))
    color_var = color_img.var()
    is_low_contrast = color_var < 2000

    return {
        "is_smooth": is_smooth,
        "is_low_contrast": is_low_contrast
    }

def predict(model, image_path: str):
    tensor = preprocess_image(image_path)
    with torch.no_grad():
        output = model(tensor)
        pred = torch.argmax(output, dim=1).item()

    # ✅ FIX LABEL: 0 = REAL, 1 = AI
    label = "REAL" if pred == 0 else "AI"

    # Get heuristics for smarter TTS
    try:
        import cv2
        heuristics = analyze_image_heuristics(image_path)
    except:
        heuristics = {"is_smooth": False, "is_low_contrast": False}

    return label, heuristics