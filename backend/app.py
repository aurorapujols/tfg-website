"""
app.py
FastAPI backend for the TFG demo.

Endpoints
─────────
POST /predict
    Accepts: multipart/form-data with one or more files.
    Files can be:
      • Individual pairs:  sample.avi + sample.xml
      • A .zip archive containing any number of (avi + xml) pairs
      • A folder upload is not directly supported by browsers — use .zip instead.

    Returns: JSON with predictions for every successfully processed sample.

POST /predict/download
    Same as /predict but returns a CSV file attachment.

GET  /health
    Returns {"status": "ok"} — used by Railway/Render health checks.

Running locally
───────────────
    pip install fastapi uvicorn python-multipart opencv-python torch torchvision
    uvicorn app:app --reload --port 8000

The frontend expects the server at the URL defined in assets/js/demo.js (API_URL).
For local development that is http://localhost:8000.
For production (Railway) set API_URL to your Railway deployment URL.
"""

import io
import os
import csv
import base64
import zipfile
import tempfile
import traceback
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from sum_img import preprocess_pair
from predictor import predictor


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Meteor Classifier API", version="1.0.0")

# Allow requests from GitHub Pages and localhost dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://YOUR_USERNAME.github.io",   # ← replace with your GitHub Pages URL
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",             # VS Code Live Server
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ── Load model at startup ─────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    try:
        predictor.load()
        print("[app] Model loaded successfully.")
    except FileNotFoundError as e:
        print(f"[app] WARNING: {e}")
        print("[app] Server will start but /predict will return 503 until weights are added.")


# ── Helpers ───────────────────────────────────────────────────────────────────

def image_to_base64(img: np.ndarray) -> str:
    """Encode a grayscale numpy array as a base64 PNG string for the frontend."""
    _, buffer = cv2.imencode('.png', img)
    return base64.b64encode(buffer).decode('utf-8')


def pair_files(files: dict[str, Path]) -> list[tuple[Path, Path]]:
    """
    Given a dict of {stem: path}, pair .avi files with their .xml counterparts.
    Returns list of (avi_path, xml_path) tuples.
    """
    avi_stems = {p.stem: p for p in files.values() if p.suffix.lower() == '.avi'}
    xml_stems = {p.stem: p for p in files.values() if p.suffix.lower() == '.xml'}

    pairs = []
    for stem, avi in avi_stems.items():
        if stem in xml_stems:
            pairs.append((avi, xml_stems[stem]))
        else:
            print(f"[pair_files] No XML found for {stem}, skipping.")
    return pairs


async def save_uploads_to_tempdir(
    upload_files: list[UploadFile],
    tmpdir: str,
) -> dict[str, Path]:
    """
    Save all uploaded files to tmpdir.
    If a .zip is uploaded, extract its contents into tmpdir.
    Returns {filename_stem: Path} for every file found.
    """
    saved = {}

    for uf in upload_files:
        data = await uf.read()
        dest = Path(tmpdir) / uf.filename

        if uf.filename.lower().endswith('.zip'):
            # Extract zip contents
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                for member in zf.namelist():
                    member_path = Path(member)
                    # Skip directories and hidden/system files
                    if member_path.suffix.lower() not in ('.avi', '.xml'):
                        continue
                    extracted = Path(tmpdir) / member_path.name
                    extracted.write_bytes(zf.read(member))
                    saved[extracted.stem] = extracted
        else:
            dest.write_bytes(data)
            saved[dest.stem] = dest

    return saved


def run_prediction(avi_path: Path, xml_path: Path) -> dict:
    """
    Preprocess a single (avi, xml) pair and run inference.
    Returns a result dict ready for JSON serialisation.
    """
    cropped_img, metadata = preprocess_pair(str(avi_path), str(xml_path))
    prediction = predictor.predict(cropped_img)

    return {
        'filename':        avi_path.stem,
        'predicted_class': prediction['predicted_class'],
        'confidence':      prediction['confidence'],
        'probabilities':   prediction['probabilities'],
        'metadata':        metadata,
        'image_b64':       image_to_base64(cropped_img),   # displayed in the results grid
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": predictor._loaded}


@app.post("/predict")
async def predict(files: list[UploadFile] = File(...)):
    """
    Accepts one or more uploaded files (avi+xml pairs, or a .zip archive).
    Returns JSON:
    {
        "results": [
            {
                "filename": "...",
                "predicted_class": "meteor" | "non-meteor",
                "confidence": 0.97,
                "probabilities": {"meteor": 0.97, "non-meteor": 0.03},
                "metadata": {...},
                "image_b64": "<base64 PNG string>"
            },
            ...
        ],
        "n_processed": 3,
        "n_skipped": 0
    }
    """
    if not predictor._loaded:
        raise HTTPException(status_code=503, detail="Model weights not loaded.")

    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    results  = []
    skipped  = []

    with tempfile.TemporaryDirectory() as tmpdir:
        saved = await save_uploads_to_tempdir(files, tmpdir)
        pairs = pair_files(saved)

        if not pairs:
            raise HTTPException(
                status_code=400,
                detail="No valid (avi + xml) pairs found. "
                       "Make sure each .avi file has a matching .xml with the same name."
            )

        for avi_path, xml_path in pairs:
            try:
                result = run_prediction(avi_path, xml_path)
                results.append(result)
            except Exception as e:
                print(f"[predict] Error on {avi_path.stem}: {e}")
                traceback.print_exc()
                skipped.append({'filename': avi_path.stem, 'error': str(e)})

    return {
        'results':     results,
        'n_processed': len(results),
        'n_skipped':   len(skipped),
        'skipped':     skipped,
    }


@app.post("/predict/download")
async def predict_download(files: list[UploadFile] = File(...)):
    """
    Same as /predict but returns a CSV file for download.
    """
    response = await predict(files)
    results  = response['results']

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'filename', 'predicted_class', 'confidence',
        'prob_meteor', 'prob_non_meteor',
        'bmin', 'bmax', 'fps', 'frames', 'width', 'height',
    ])
    writer.writeheader()

    for r in results:
        writer.writerow({
            'filename':        r['filename'],
            'predicted_class': r['predicted_class'],
            'confidence':      r['confidence'],
            'prob_meteor':     r['probabilities'].get('meteor', ''),
            'prob_non_meteor': r['probabilities'].get('non-meteor', ''),
            **{k: r['metadata'].get(k, '') for k in ('bmin', 'bmax', 'fps', 'frames', 'width', 'height')},
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=predictions.csv"},
    )
