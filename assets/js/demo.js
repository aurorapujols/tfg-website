/* ═══════════════════════════════════════════════════════════════
   demo.js
   Handles all interactivity on the Demo page:
     • Tab switching (Prediction / Cluster Explorer)
     • File upload (drag-and-drop, browse, or .zip)
     • Calls the Python backend API
     • Renders the results grid
     • CSV + image download
     • Cluster visualisation stub

   CONFIGURATION
   ──────────────
   Change API_URL to your Railway deployment URL before going live.
   During local development, run `uvicorn app:app --port 8000` in backend/.
═══════════════════════════════════════════════════════════════ */

// ── API endpoint ─────────────────────────────────────────────────────────────
const API_URL = 'https://tfg-website-backend-production.up.railway.app';   // ← change to Railway URL for production

// ── Exposed so router.js can re-run after navigation ─────────────────────────
window.initDemo = function () {
  'use strict';

  // ── Tab switching ───────────────────────────────────────────────────────────
  const tabs   = document.querySelectorAll('.demo-tab');
  const panels = document.querySelectorAll('.demo-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t   => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');
      if (tab.dataset.tab === 'cluster') initClusterPlot();
    });
  });

  // ── Upload zone ─────────────────────────────────────────────────────────────
  const zone      = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (!zone || !fileInput) return;

  zone.addEventListener('click',     () => fileInput.click());
  zone.addEventListener('dragover',  e  => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) handleFiles(fileInput.files);
  });

  // ── File handling ───────────────────────────────────────────────────────────
  function handleFiles(fileList) {
    const files = Array.from(fileList);
    const label = zone.querySelector('.upload-zone__primary');

    // Show file count summary
    const zips  = files.filter(f => f.name.toLowerCase().endsWith('.zip'));
    const avis  = files.filter(f => f.name.toLowerCase().endsWith('.avi'));
    const xmls  = files.filter(f => f.name.toLowerCase().endsWith('.xml'));

    if (zips.length) {
      if (label) label.textContent = `✦  ${zips[0].name}`;
    } else {
      if (label) label.textContent = `✦  ${avis.length} video(s) · ${xmls.length} XML(s)`;
    }

    submitFiles(files);
  }

  // ── API call ────────────────────────────────────────────────────────────────
  async function submitFiles(files) {
    showState('loading');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body:   formData,
      });

      if (res.status === 503) {
        showError('Model weights are not loaded on the server yet. See backend/README.md.');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        showError(err.detail || 'Server error.');
        return;
      }

      const data = await res.json();
      showResults(data);

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showError(`Cannot reach the backend at ${API_URL}. Is the server running?`);
      } else {
        showError(`Unexpected error: ${err.message}`);
      }
    }
  }

  // ── UI states ───────────────────────────────────────────────────────────────
  function showState(state) {
    const loading = document.getElementById('results-loading');
    const error   = document.getElementById('results-error');
    const grid    = document.getElementById('results-grid-section');

    loading?.style && (loading.style.display = state === 'loading' ? 'flex' : 'none');
    error?.style   && (error.style.display   = state === 'error'   ? 'flex' : 'none');
    grid?.style    && (grid.style.display    = state === 'results' ? 'block' : 'none');
  }

  function showError(message) {
    showState('error');
    const el = document.getElementById('error-message');
    if (el) el.textContent = message;
  }

  // ── Render results grid ─────────────────────────────────────────────────────
  function showResults(data) {
    showState('results');

    const { results, n_processed, n_skipped, skipped } = data;

    // Summary bar
    const summaryEl = document.getElementById('results-summary');
    if (summaryEl) {
      const meteors    = results.filter(r => r.predicted_class === 'meteor').length;
      const nonMeteors = results.filter(r => r.predicted_class === 'non-meteor').length;
      summaryEl.innerHTML =
        `<span class="summary-stat"><strong>${n_processed}</strong> processed</span>` +
        `<span class="summary-divider">·</span>` +
        `<span class="summary-stat meteor-stat"><strong>${meteors}</strong> meteor${meteors !== 1 ? 's' : ''}</span>` +
        `<span class="summary-divider">·</span>` +
        `<span class="summary-stat non-stat"><strong>${nonMeteors}</strong> non-meteor${nonMeteors !== 1 ? 's' : ''}</span>` +
        (n_skipped ? `<span class="summary-divider">·</span><span class="summary-stat skip-stat">${n_skipped} skipped</span>` : '');
    }

    // Results grid
    const gridEl = document.getElementById('results-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    results.forEach(r => {
      const isMeteor  = r.predicted_class === 'meteor';
      const pct       = Math.round(r.confidence * 100);
      const card      = document.createElement('div');
      card.className  = `result-card-item ${isMeteor ? 'result-card-item--meteor' : 'result-card-item--non-meteor'}`;

      card.innerHTML = `
        <div class="rci__image-wrap">
          <img src="data:image/png;base64,${r.image_b64}"
               alt="Cropped sum image for ${r.filename}"
               class="rci__image">
          <div class="rci__badge rci__badge--${isMeteor ? 'meteor' : 'non'}">
            ${isMeteor ? '✦ Meteor' : '✕ Non-meteor'}
          </div>
        </div>
        <div class="rci__body">
          <p class="rci__filename" title="${r.filename}">${r.filename}</p>
          <div class="rci__confidence">
            <span class="rci__conf-label">Confidence</span>
            <div class="rci__conf-track">
              <div class="rci__conf-fill" style="width:${pct}%; background:${isMeteor ? 'var(--gold)' : 'var(--blue-star)'}"></div>
            </div>
            <span class="rci__conf-pct">${pct}%</span>
          </div>
          <div class="rci__probs">
            <span class="rci__prob-label">Meteor</span>
            <span class="rci__prob-val">${Math.round((r.probabilities['meteor'] || 0) * 100)}%</span>
            <span class="rci__prob-label">Non-meteor</span>
            <span class="rci__prob-val">${Math.round((r.probabilities['non-meteor'] || 0) * 100)}%</span>
          </div>
        </div>`;

      gridEl.appendChild(card);
    });

    // Store results for download
    window._lastResults = results;
  }

  // ── Download CSV ────────────────────────────────────────────────────────────
  const btnCsv = document.getElementById('btn-download-csv');
  btnCsv?.addEventListener('click', () => {
    if (!window._lastResults?.length) return;
    const rows = [
      ['filename', 'predicted_class', 'confidence', 'prob_meteor', 'prob_non_meteor'].join(','),
      ...window._lastResults.map(r => [
        r.filename,
        r.predicted_class,
        r.confidence,
        r.probabilities['meteor']     ?? '',
        r.probabilities['non-meteor'] ?? '',
      ].join(','))
    ];
    downloadBlob(rows.join('\n'), 'predictions.csv', 'text/csv');
  });

  // ── Download images ─────────────────────────────────────────────────────────
  const btnImgs = document.getElementById('btn-download-images');
  btnImgs?.addEventListener('click', async () => {
    if (!window._lastResults?.length) return;

    // Dynamically load JSZip from CDN if not already present
    if (!window.JSZip) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }

    const zip = new window.JSZip();
    window._lastResults.forEach(r => {
      const b64data = r.image_b64;
      zip.file(`${r.filename}_${r.predicted_class}.png`, b64data, { base64: true });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'cropped_images.zip', 'application/zip');
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function downloadBlob(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s   = document.createElement('script');
      s.src     = src;
      s.onload  = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── Cluster plot stub ───────────────────────────────────────────────────────
  let clusterInitialised = false;

  function initClusterPlot() {
    if (clusterInitialised) return;
    clusterInitialised = true;

    fetch('assets/data/embeddings.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(data => {
        const plotEl       = document.getElementById('cluster-plot');
        const placeholder  = document.querySelector('.viz-placeholder');
        const vizArea      = document.querySelector('.viz-area');

        if (placeholder) placeholder.style.display = 'none';
        if (vizArea)     vizArea.classList.remove('viz-area--empty');
        if (plotEl)      plotEl.style.display = 'block';

        // ── Plotly render (uncomment once embeddings.json is ready) ─────────
        // Add to index.html: <script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
        //
        // const PALETTE = ['#c9a84c','#7aaed4','#d47a7a','#84c97a','#c97acd'];
        // const byClass = {};
        // data.points.forEach(p => (byClass[p.label] = byClass[p.label] || []).push(p));
        // const traces = Object.entries(byClass).map(([name, pts], i) => ({
        //   type: 'scatter', mode: 'markers', name,
        //   x: pts.map(p => p.x), y: pts.map(p => p.y),
        //   marker: { size: 5, color: PALETTE[i % PALETTE.length], opacity: 0.75 }
        // }));
        // const layout = {
        //   paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        //   font:   { family: 'JetBrains Mono, monospace', color: '#8a8580', size: 11 },
        //   xaxis:  { showgrid: false, zeroline: false, title: 'UMAP 1' },
        //   yaxis:  { showgrid: false, zeroline: false, title: 'UMAP 2' },
        //   legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: 'rgba(180,160,100,0.15)' },
        //   margin: { l: 40, r: 20, t: 20, b: 40 }
        // };
        // Plotly.newPlot('cluster-plot', traces, layout, { responsive: true });
      })
      .catch(() => console.info('demo.js: embeddings.json not found — cluster plot disabled.'));
  }
};

// Auto-init on first load if already on the demo page
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (document.getElementById('upload-zone')) window.initDemo();
  }, 100);
});
