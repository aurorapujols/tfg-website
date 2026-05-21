"""
predictor.py
Loads the trained SSLResNet model and runs inference on preprocessed images.

Place your saved model weights at:
    backend/weights/classifier.pt   ← linear probe (meteor vs non-meteor)
    backend/weights/encoder.pt      ← SSL encoder backbone (SSLResNet)

The classifier is a simple linear layer trained on top of the frozen encoder.
If you only have the encoder weights, set CLASSIFIER_TYPE = 'logistic' and the
predictor will load a saved sklearn LogisticRegression instead.
"""

import numpy as np
import torch
import torch.nn as nn
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
ENCODER_PATH    = Path(__file__).parent / 'weights' / 'encoder.pt'
CLASSIFIER_PATH = Path(__file__).parent / 'weights' / 'classifier.pt'
IMAGE_SIZE      = 255     # must match training
RESNET_DIM      = 512
PROJECTION_DIM  = 256
CLASS_NAMES     = ['non-meteor', 'meteor']   # index 0 = non-meteor, 1 = meteor


# ── Minimal model definitions (mirrors ssl_model.py / modules.py) ─────────────
# Kept here so the backend has no dependency on the full project source tree.
# Update these to exactly match your SSLBackboneResNet and SSLProjectionHeadSimCLR.

import torchvision.models as tv_models

class SSLBackboneResNet(nn.Module):
    def __init__(self, res_net_dim: int = 512):
        super().__init__()
        base = tv_models.resnet18(weights=None)
        # Replace first conv to accept 1-channel (grayscale) input
        base.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        # Remove the final classification head
        self.encoder = nn.Sequential(*list(base.children())[:-1])
        self.out_dim = res_net_dim   # ResNet-18 final pool → 512

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = self.encoder(x)          # (B, 512, 1, 1)
        return h.flatten(1)          # (B, 512)


class SSLProjectionHeadSimCLR(nn.Module):
    def __init__(self, in_dim: int = 512, out_dim: int = 256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, in_dim),
            nn.ReLU(),
            nn.Linear(in_dim, out_dim),
        )

    def forward(self, h: torch.Tensor) -> torch.Tensor:
        return self.net(h)


class SSLResNet(nn.Module):
    def __init__(self, res_net_dim: int = 512, projection_dim: int = 256):
        super().__init__()
        self.encoder   = SSLBackboneResNet(res_net_dim)
        self.projector = SSLProjectionHeadSimCLR(res_net_dim, projection_dim)

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            return self.encoder(x)


class LinearProbe(nn.Module):
    """Single linear layer trained on top of frozen encoder embeddings."""
    def __init__(self, in_dim: int = 512, n_classes: int = 2):
        super().__init__()
        self.fc = nn.Linear(in_dim, n_classes)

    def forward(self, h: torch.Tensor) -> torch.Tensor:
        return self.fc(h)


# ── Predictor ─────────────────────────────────────────────────────────────────

class Predictor:
    def __init__(self):
        self.device    = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.encoder   = None
        self.classifier = None
        self._loaded   = False

    def load(self):
        """Load encoder + classifier weights. Call once at server startup."""
        if self._loaded:
            return

        if not ENCODER_PATH.exists():
            raise FileNotFoundError(
                f"Encoder weights not found at {ENCODER_PATH}. "
                "Place encoder.pt in backend/weights/."
            )
        if not CLASSIFIER_PATH.exists():
            raise FileNotFoundError(
                f"Classifier weights not found at {CLASSIFIER_PATH}. "
                "Place classifier.pt in backend/weights/."
            )

        # Load encoder
        self.encoder = SSLResNet(RESNET_DIM, PROJECTION_DIM)
        state = torch.load(ENCODER_PATH, map_location=self.device, weights_only=True)
        self.encoder.load_state_dict(state)
        self.encoder.to(self.device)
        self.encoder.eval()

        # Load linear probe
        self.classifier = LinearProbe(in_dim=RESNET_DIM, n_classes=len(CLASS_NAMES))
        clf_state = torch.load(CLASSIFIER_PATH, map_location=self.device, weights_only=True)
        self.classifier.load_state_dict(clf_state)
        self.classifier.to(self.device)
        self.classifier.eval()

        self._loaded = True
        print(f"[Predictor] Loaded on {self.device}")

    def predict(self, image: np.ndarray) -> dict:
        """
        Run inference on a single preprocessed grayscale image (H×W uint8).
        Returns {predicted_class, confidence, probabilities}.
        """
        if not self._loaded:
            self.load()

        # Normalise → tensor  (1, 1, H, W)
        img = image.astype(np.float32) / 255.0
        tensor = torch.from_numpy(img).unsqueeze(0).unsqueeze(0).to(self.device)

        with torch.no_grad():
            h      = self.encoder.encode(tensor)           # (1, 512)
            logits = self.classifier(h)                    # (1, 2)
            probs  = torch.softmax(logits, dim=1).cpu().numpy()[0]

        pred_idx    = int(np.argmax(probs))
        pred_class  = CLASS_NAMES[pred_idx]
        confidence  = float(probs[pred_idx])

        return {
            'predicted_class': pred_class,
            'confidence':      round(confidence, 4),
            'probabilities': {
                CLASS_NAMES[i]: round(float(probs[i]), 4)
                for i in range(len(CLASS_NAMES))
            },
        }

    def predict_batch(self, images: list[np.ndarray]) -> list[dict]:
        """Run predict() on a list of images."""
        return [self.predict(img) for img in images]


# Singleton — imported by app.py
predictor = Predictor()
