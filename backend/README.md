# Backend — Meteor Classifier API

FastAPI server that handles preprocessing and model inference for the demo page.

## Structure

```
backend/
├── app.py              ← FastAPI routes (/predict, /predict/download, /health)
├── predictor.py        ← Model loading + inference (SSLResNet + LinearProbe)
├── sum_img.py          ← Preprocessing pipeline (adapted from project source)
├── requirements.txt
├── Procfile            ← Railway startup command
├── weights/            ← PUT YOUR MODEL WEIGHTS HERE (not committed to git)
│   ├── encoder.pt          SSL encoder (SSLResNet state dict)
│   └── classifier.pt       Linear probe state dict
└── README.md
```

---

## Adding your model weights

Save your trained model weights:

```python
# Save encoder (SSLResNet full model)
torch.save(model.state_dict(), 'backend/weights/encoder.pt')

# Save linear probe
torch.save(linear_probe.state_dict(), 'backend/weights/classifier.pt')
```

Add `backend/weights/` to your `.gitignore` if the files are large,
and upload them directly in the Railway dashboard instead.

---

## Running locally

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The API will be at `http://localhost:8000`.  
Open `http://localhost:8000/docs` for the interactive Swagger UI.

Update `API_URL` in `assets/js/demo.js` to `http://localhost:8000` while developing.

---

## Deploying to Railway

1. Create a **new repository** (or subfolder) for the backend — Railway deploys one service per repo.
2. Push the contents of this `backend/` folder as the root of that repo.
3. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
4. Railway will detect the `Procfile` and install `requirements.txt` automatically.
5. Once deployed, copy the public URL (e.g. `https://your-app.railway.app`).
6. In `assets/js/demo.js`, set `API_URL` to that URL.
7. In `app.py`, add your GitHub Pages URL to the `allow_origins` list.

### Uploading weights to Railway

Option A — include in the repo (fine if files are < 100 MB):
```bash
git add backend/weights/
git commit -m "add model weights"
git push
```

Option B — use Railway volumes or environment variables for large files.

---

## Adjusting the preprocessing

The `sum_img.py` in this folder is a standalone adaptation of your project&rsquo;s
preprocessing code. It removes the `config` dependency so it runs without your
full project tree.

If your XML files use different tag names for the bounding box coordinates,
update the `parse_bbox_from_xml` function in `sum_img.py`:

```python
# Current (adjust to match your actual XML structure):
x1 = get('x1', float, 0)
y1 = get('y1', float, 0)
x2 = get('x2', float, 0)
y2 = get('y2', float, 0)
```

If your `config.preprocessing` values differ from the defaults at the top of
`sum_img.py`, update `MASK_PIXELS`, `BBOX_PADDING`, `TOP_OFFSET`, `LEFT_OFFSET`.
