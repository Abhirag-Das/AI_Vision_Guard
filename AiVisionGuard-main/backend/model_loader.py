# backend/model_loader.py

import torch
import torch.nn as nn
import timm
from efficientnet_pytorch import EfficientNet

# =============== IMAGE MODEL: gardv5.pth ===============
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

# =============== VIDEO MODEL: gradv6.pth ===============
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

# =============== LOADER FUNCTIONS ===============
def load_image_model(path: str):
    model = ImageGuard()
    state_dict = torch.load(path, map_location="cpu")
    model.load_state_dict(state_dict)
    return model.eval()

def load_video_model(path: str):
    model = VideoGuard()
    state_dict = torch.load(path, map_location="cpu")
    model.load_state_dict(state_dict)
    return model.eval()