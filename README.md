# Contrastive Self-Supervised Learning for Astronomical Phenomena Identification

> **TFG · AURORA Pujols Rial · Universitat Pompeu Fabra · 2026**  
> Live site: `https://aurorapujols.github.io/tfg-website`

---

## Project Structure

```
tfg-site/
│
├── index.html                ← Entry point. Do not edit page content here —
│                               it only loads CSS, JS, and mounts the nav/footer.
│
├── pages/                    ← ONE FILE PER PAGE. Edit content here.
│   ├── home.html               Overview, hero, methodology pipeline, results
│   ├── data.html               Dataset origins, processing timeline, download
│   ├── demo.html               Prediction upload + cluster visualisation tabs
│   └── about.html              Author bio, acknowledgements, resource links
│
├── assets/
│   │
│   ├── css/                  ← ONE FILE PER CONCERN.
│   │   ├── variables.css       Design tokens (colours, fonts, spacing) — edit to retheme
│   │   ├── base.css            Reset, typography, layout primitives
│   │   ├── components.css      Reusable UI pieces (buttons, cards, code blocks)
│   │   ├── nav.css             Navigation bar + footer
│   │   ├── page-home.css       Styles only used on the Home page
│   │   ├── page-data.css       Styles only used on the Dataset page
│   │   ├── page-demo.css       Styles only used on the Demo page
│   │   └── page-about.css      Styles only used on the About page
│   │
│   ├── js/
│   │   ├── starfield.js        Animated star/meteor canvas — no external deps
│   │   ├── components.js       Renders nav + footer HTML; hamburger logic
│   │   ├── router.js           SPA routing — fetches pages/*.html fragments
│   │   └── demo.js             Upload zone, tab switching, model + cluster hooks
│   │
│   ├── models/               ← PUT YOUR MODEL FILES HERE
│   │   └── classifier.onnx     (rename/add as needed)
│   │
│   ├── data/                 ← PUT YOUR DATA FILES HERE
│   │   └── embeddings.json     UMAP/t-SNE projection (see format below)
│   │
│   ├── images/               ← Site images (figures, diagrams, screenshots)
│   │   └── (add images here)
│   │
│   └── report.pdf            ← PUT YOUR THESIS PDF HERE
│
└── README.md
```

---

## GitHub Pages Setup

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under *Source* select **Deploy from a branch** → `main` → `/ (root)`.
4. Save. Your site will be live in ~60 seconds at  
   `https://YOUR_USERNAME.github.io/YOUR_REPO`

> **No build step required** — pure HTML, CSS, and vanilla JS.  
> If your repo is not at the root (e.g. it is inside a subfolder), no extra config is needed because all asset paths are relative.

---

## What to Fill In

### Text placeholders
Search for these strings in the `pages/` files and replace them:

| String | Replace with |
|---|---|
| `YOUR NAME HERE` / `YOUR NAME` | Your full name |
| `SUPERVISOR NAME` | Your supervisor's name |
| `YOUR_USERNAME` | Your GitHub username |
| `YOUR_REPO` | Your repository name |
| `your@email.com` | Your email address |
| `YOUR_PROFILE` | Your LinkedIn profile slug |
| `TBD` fields | Actual dataset counts, file sizes, etc. |
| `—` result values | Model accuracy / cluster count / etc. |
| `[Describe …]` blocks | Your actual text |

Also update the **BibTeX** entry at the bottom of `pages/data.html`.

### Files to add

| File | Purpose |
|---|---|
| `assets/report.pdf` | Your thesis PDF — download buttons already point here |
| `assets/models/classifier.onnx` | Exported ONNX model for in-browser inference |
| `assets/data/embeddings.json` | 2D embedding projection for the cluster plot |
| `assets/images/*` | Any figures or diagrams you want to embed in pages |

---

## Connecting the Demo

### A — Classification prediction (ONNX in-browser, recommended for GitHub Pages)

1. Export your trained model to ONNX format:
   ```python
   import torch
   dummy = torch.randn(1, INPUT_SIZE)
   torch.onnx.export(model, dummy, "classifier.onnx",
                     input_names=["input"], output_names=["logits"])
   ```
2. Place the file at `assets/models/classifier.onnx`.
3. Add ONNX Runtime Web to `index.html` (before the closing `</body>`):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"></script>
   ```
4. In `assets/js/demo.js`, find the **MODEL INTEGRATION POINT** comment and
   replace the stub with an `ort.InferenceSession` call.

### B — REST API (if you have a backend server)

Replace the stub in `demo.js` with a `fetch()` call to your endpoint:
```js
const formData = new FormData();
formData.append('file', file);
const response = await fetch('https://your-api.example.com/predict', {
  method: 'POST', body: formData
});
const data = await response.json();
setResult({ label: data.predicted_class, confidence: data.confidence });
```

---

## Connecting the Cluster Plot

### embeddings.json format

```json
{
  "points": [
    { "x": 1.23, "y": -0.45, "label": "Sporadic",  "cluster": 0 },
    { "x": -2.1, "y":  1.88, "label": "Perseid",   "cluster": 1 },
    ...
  ],
  "classes": ["Sporadic", "Perseid", "Leonid"]
}
```

Generate from Python after computing a UMAP projection:
```python
import json, umap
reducer = umap.UMAP(n_components=2, random_state=42)
coords  = reducer.fit_transform(embeddings)

points = [
    {"x": float(coords[i, 0]), "y": float(coords[i, 1]),
     "label": labels[i], "cluster": int(cluster_ids[i])}
    for i in range(len(coords))
]
with open("embeddings.json", "w") as f:
    json.dump({"points": points, "classes": list(set(labels))}, f)
```

### Plotly render

1. Add Plotly to `index.html`:
   ```html
   <script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
   ```
2. In `demo.js`, find the **CLUSTER INTEGRATION POINT** comment and uncomment
   the Plotly block. Adjust colours and axis labels as needed.

---

## Customising the Design

All design tokens live in **`assets/css/variables.css`** — that is the only file
you need to touch to retheme the entire site:

```css
--gold:        #c9a84c;   /* accent colour                  */
--bg:          #080b12;   /* page background                */
--font-display: 'Cormorant Garamond', serif;  /* headings   */
--font-mono:    'JetBrains Mono', monospace;  /* labels/code */
```

---

## Adding a New Page

1. Create `pages/my-page.html` (copy the structure from any existing page file).
2. Add a nav link in `assets/js/components.js`:
   ```html
   <li><a class="nav__link" data-page="my-page">My Page</a></li>
   ```
3. Register the route in `assets/js/router.js`:
   ```js
   const PAGES = {
     ...
     'my-page': 'pages/my-page.html',
   };
   ```
4. Optionally create `assets/css/page-my-page.css` and link it in `index.html`.
