"""
sum_img.py
Adapted from the original project preprocessing code.
Removed config dependencies so it runs standalone in the API server.
"""

import cv2
import numpy as np
import xml.etree.ElementTree as ET
from pathlib import Path


# ── Constants (match your original config values) ────────────────────────────
# Update these to match config.preprocessing values if they differ.
MASK_PIXELS       = 30      # pixels to mask at bottom (watermark)
BBOX_PADDING      = 20      # padding around detected bounding box
TOP_OFFSET        = 0       # bbox y adjustment
LEFT_OFFSET       = 0       # bbox x adjustment
CROP_BLACK = dict(top=0, bottom=0, left=0, right=0)   # remove_black_frame offsets


# ── Helpers ───────────────────────────────────────────────────────────────────

def apply_mask(frame: np.ndarray, mask: np.ndarray) -> np.ndarray:
    return cv2.bitwise_and(frame, frame, mask=mask)


def remove_black_frame(sum_image: np.ndarray) -> np.ndarray:
    h, w = sum_image.shape
    t = CROP_BLACK['top']
    b = CROP_BLACK['bottom']
    l = CROP_BLACK['left']
    r = CROP_BLACK['right']
    return sum_image[t: h - b if b else h, l: w - r if r else w]


def parse_bbox_from_xml(xml_path: str, padding: int = BBOX_PADDING):
    """
    Extract bounding box and metadata from a UFOCaptureV2 XML file.
    Returns (bbox dict, metadata dict).
    """
    tree = ET.parse(xml_path)
    root = tree.getroot()

    # UFOCaptureV2 XML structure — adjust tag names if yours differ
    # Common tags: UA2, ANS, fno, bmin, bmax, fps, ...
    def get(tag, cast=str, default=None):
        el = root.find(f'.//{tag}')
        if el is None:
            return default
        try:
            return cast(el.text.strip())
        except Exception:
            return default

    # Trajectory bounding box  (tags: x1,y1 = start; x2,y2 = end of trail)
    # UFOCaptureV2 stores them inside <ANS> or <UA2> blocks — tweak as needed.
    x1 = get('x1', float, 0)
    y1 = get('y1', float, 0)
    x2 = get('x2', float, 0)
    y2 = get('y2', float, 0)

    x_min = min(x1, x2) - padding
    x_max = max(x1, x2) + padding
    y_min = min(y1, y2) - padding
    y_max = max(y1, y2) + padding

    bbox = dict(x_min=x_min, x_max=x_max, y_min=y_min, y_max=y_max)

    metadata = {
        'bmin':   get('bmin', int,   0),
        'bmax':   get('bmax', int,   255),
        'fps':    get('fps',  int,   25),
        'frames': get('fno',  float, 0),
        'width':  abs(x_max - x_min),
        'height': abs(y_max - y_min),
    }

    return bbox, metadata


# ── Core functions ────────────────────────────────────────────────────────────

def generate_sum_image(video_path: str) -> np.ndarray:
    """
    Build a sum image from a .avi clip:
      1. Read first frame as background
      2. Mask the watermark strip at the bottom
      3. For each subsequent frame: subtract background, accumulate with max
      4. Trim the black border introduced by the mask
    Returns a grayscale numpy array.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {video_path}")

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Mask: block the bottom watermark strip
    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.rectangle(mask, (0, 0), (width, height - MASK_PIXELS), 255, thickness=-1)

    # First frame → background
    ret, first_frame = cap.read()
    if not ret:
        cap.release()
        raise IOError(f"Cannot read first frame: {video_path}")

    first_gray   = cv2.cvtColor(first_frame, cv2.COLOR_BGR2GRAY)
    first_masked = apply_mask(first_gray, mask)

    # Accumulate frame differences
    sum_image = np.zeros_like(first_masked, dtype=np.uint8)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        gray   = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        masked = apply_mask(gray, mask)
        diff   = cv2.absdiff(masked, first_masked)
        sum_image = np.maximum(sum_image, diff)

    cap.release()
    sum_image = remove_black_frame(sum_image)
    return sum_image


def generate_cropped_sum_image(
    sum_img: np.ndarray,
    xml_path: str,
    target_size: int = 255,
) -> tuple[np.ndarray, dict, dict]:
    """
    Crop the sum image around the detected trajectory bounding box
    and resize to target_size × target_size.
    Returns (cropped_resized_image, bbox, metadata).
    """
    bbox, metadata = parse_bbox_from_xml(xml_path)

    x_min = int(bbox['x_min'])
    x_max = int(bbox['x_max'])
    y_min = int(bbox['y_min'])
    y_max = int(bbox['y_max'])

    h, w = sum_img.shape

    x_min_adj = max(0, x_min - LEFT_OFFSET)
    x_max_adj = min(w, x_max - LEFT_OFFSET)
    y_min_adj = max(0, y_min - TOP_OFFSET)
    y_max_adj = min(h, y_max - TOP_OFFSET)

    cropped = sum_img[y_min_adj:y_max_adj, x_min_adj:x_max_adj]

    # Fallback: if bbox is degenerate, use the whole image
    if cropped.size == 0:
        cropped = sum_img

    resized = cv2.resize(cropped, (target_size, target_size),
                         interpolation=cv2.INTER_LINEAR)

    return resized, bbox, metadata


def preprocess_pair(video_path: str, xml_path: str, target_size: int = 255):
    """
    Full pipeline for a single (video, xml) pair.
    Returns (cropped_sum_image as np.ndarray HxW uint8, metadata dict).
    """
    sum_img = generate_sum_image(video_path)
    cropped, bbox, metadata = generate_cropped_sum_image(sum_img, xml_path,
                                                         target_size=target_size)
    return cropped, metadata
