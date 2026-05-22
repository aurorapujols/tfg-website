/* ═══════════════════════════════════════════════════════════════
   demo.js

   Features:
     • Results persist in localStorage across page refreshes
     • New uploads append to the existing grid (no reset)
     • Duplicate filenames are skipped automatically
     • Storage counter shows X / MAX_STORED predictions
     • At 45/50 predictions a warning banner appears
     • At 50 predictions: auto-downloads CSV + images zip, then clears
     • Manual "Clear all" button always available
     • CSV and image downloads cover ALL stored results
═══════════════════════════════════════════════════════════════ */

const API_URL    = 'https://intuitive-strength.up.railway.app';
const STORAGE_KEY = 'meteor_predictions_v1';
const MAX_STORED  = 50;
const WARN_AT     = 45;

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

  // ── localStorage helpers ────────────────────────────────────────────────────
  function loadStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveStored(results) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (e) {
      // localStorage full — trigger download and clear
      console.warn('localStorage full:', e);
      triggerDownloadAndClear();
    }
  }

  function clearStored() {
    localStorage.removeItem(STORAGE_KEY);
  }

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
    fileInput.value = '';   // reset so same file can be re-selected
  });

  // ── File handling ───────────────────────────────────────────────────────────
  function handleFiles(fileList) {
    const files = Array.from(fileList);
    const label = zone.querySelector('.upload-zone__primary');
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
        showError('Model weights are not loaded on the server yet.');
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        showError(err.detail || 'Server error.');
        return;
      }

      const data = await res.json();
      appendResults(data.results, data.n_skipped, data.skipped);

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showError(`Cannot reach the backend at ${API_URL}.`);
      } else {
        showError(`Unexpected error: ${err.message}`);
      }
    }
  }

  // ── Append new results to stored + grid ─────────────────────────────────────
  function appendResults(newResults, nSkipped, skipped) {
    const stored   = loadStored();
    const existing = new Set(stored.map(r => r.filename));

    let added     = 0;
    let duplicate = 0;

    for (const r of newResults) {
      if (existing.has(r.filename)) {
        duplicate++;
        continue;
      }
      stored.push(r);
      existing.add(r.filename);
      added++;
    }

    saveStored(stored);
    renderGrid(stored);
    updateCounter(stored.length);
    showState('results');

    // Show what happened in the upload zone label
    const label = zone.querySelector('.upload-zone__primary');
    let msg = `✦  ${added} added`;
    if (duplicate) msg += ` · ${duplicate} duplicate${duplicate > 1 ? 's' : ''} skipped`;
    if (nSkipped)  msg += ` · ${nSkipped} failed`;
    if (label) label.textContent = msg;

    // Check if approaching or at limit
    if (stored.length >= MAX_STORED) {
      triggerDownloadAndClear();
    } else if (stored.length >= WARN_AT) {
      showStorageWarning(stored.length);
    }
  }

  // ── Render the full grid from stored results ────────────────────────────────
  function renderGrid(results) {
    const gridEl = document.getElementById('results-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    if (!results.length) {
      showState('idle');
      return;
    }

    results.forEach(r => {
      const isMeteor = r.predicted_class === 'meteor';
      const pct      = Math.round(r.confidence * 100);
      const card     = document.createElement('div');
      card.className = `result-card-item ${isMeteor ? 'result-card-item--meteor' : 'result-card-item--non-meteor'}`;
      card.dataset.filename = r.filename;

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
              <div class="rci__conf-fill" style="width:${pct}%;background:${isMeteor ? 'var(--gold)' : 'var(--blue-star)'}"></div>
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

    updateSummary(results);
  }

  // ── Summary bar ─────────────────────────────────────────────────────────────
  function updateSummary(results) {
    const summaryEl = document.getElementById('results-summary');
    if (!summaryEl) return;

    const meteors    = results.filter(r => r.predicted_class === 'meteor').length;
    const nonMeteors = results.filter(r => r.predicted_class === 'non-meteor').length;

    summaryEl.innerHTML =
      `<span class="summary-stat"><strong>${results.length}</strong> total</span>` +
      `<span class="summary-divider">·</span>` +
      `<span class="summary-stat meteor-stat"><strong>${meteors}</strong> meteor${meteors !== 1 ? 's' : ''}</span>` +
      `<span class="summary-divider">·</span>` +
      `<span class="summary-stat non-stat"><strong>${nonMeteors}</strong> non-meteor${nonMeteors !== 1 ? 's' : ''}</span>`;
  }

  // ── Storage counter ──────────────────────────────────────────────────────────
  function updateCounter(count) {
    const el = document.getElementById('storage-counter');
    if (!el) return;
    el.textContent = `${count} / ${MAX_STORED} stored`;
    el.className   = 'storage-counter' +
      (count >= MAX_STORED ? ' storage-counter--full' :
       count >= WARN_AT    ? ' storage-counter--warn' : '');
  }

  // ── Storage warning banner ───────────────────────────────────────────────────
  function showStorageWarning(count) {
    const el = document.getElementById('storage-warning');
    if (!el) return;
    el.style.display = 'flex';
    const msg = el.querySelector('#storage-warning-msg');
    if (msg) msg.textContent =
      `${count} of ${MAX_STORED} predictions stored. Download your results before the limit is reached.`;
  }

  // ── Auto download + clear at limit ──────────────────────────────────────────
  async function triggerDownloadAndClear() {
    const stored = loadStored();
    if (!stored.length) return;

    // Show message
    const el = document.getElementById('storage-warning');
    if (el) {
      el.style.display = 'flex';
      const msg = el.querySelector('#storage-warning-msg');
      if (msg) msg.textContent =
        `Storage limit reached (${MAX_STORED}). Downloading your results automatically…`;
    }

    // Download CSV
    downloadCSV(stored);

    // Download images zip
    await downloadImagesZip(stored);

    // Clear after short delay so downloads can start
    setTimeout(() => {
      clearStored();
      renderGrid([]);
      updateCounter(0);
      if (el) el.style.display = 'none';
      const label = zone.querySelector('.upload-zone__primary');
      if (label) label.textContent = 'Drop files or a .zip here';
    }, 1500);
  }

  // ── UI states ────────────────────────────────────────────────────────────────
  function showState(state) {
    const loading = document.getElementById('results-loading');
    const error   = document.getElementById('results-error');
    const grid    = document.getElementById('results-grid-section');

    if (loading) loading.style.display = state === 'loading' ? 'flex'  : 'none';
    if (error)   error.style.display   = state === 'error'   ? 'flex'  : 'none';
    if (grid)    grid.style.display    = (state === 'results' || state === 'idle') ? 'block' : 'none';
  }

  function showError(message) {
    showState('error');
    const el = document.getElementById('error-message');
    if (el) el.textContent = message;
  }

  // ── Download CSV (all stored) ────────────────────────────────────────────────
  function downloadCSV(results) {
    const rows = [
      ['filename', 'predicted_class', 'confidence', 'prob_meteor', 'prob_non_meteor'].join(','),
      ...results.map(r => [
        r.filename,
        r.predicted_class,
        r.confidence,
        r.probabilities['meteor']      ?? '',
        r.probabilities['non-meteor']  ?? '',
      ].join(','))
    ];
    downloadBlob(rows.join('\n'), 'predictions.csv', 'text/csv');
  }

  // ── Download images zip (all stored) ────────────────────────────────────────
  async function downloadImagesZip(results) {
    if (!window.JSZip) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }
    const zip = new window.JSZip();
    results.forEach(r => {
      zip.file(`${r.filename}_${r.predicted_class}.png`, r.image_b64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'cropped_images.zip', 'application/zip');
  }

  // ── Button wiring ────────────────────────────────────────────────────────────
  document.getElementById('btn-download-csv')?.addEventListener('click', () => {
    const stored = loadStored();
    if (stored.length) downloadCSV(stored);
  });

  document.getElementById('btn-download-images')?.addEventListener('click', async () => {
    const stored = loadStored();
    if (stored.length) await downloadImagesZip(stored);
  });

  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (!confirm('Clear all stored predictions? This cannot be undone.')) return;
    clearStored();
    renderGrid([]);
    updateCounter(0);
    showState('idle');
    const label = zone.querySelector('.upload-zone__primary');
    if (label) label.textContent = 'Drop files or a .zip here';
    const warn = document.getElementById('storage-warning');
    if (warn) warn.style.display = 'none';
  });

  document.getElementById('btn-download-and-clear')?.addEventListener('click', async () => {
    await triggerDownloadAndClear();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
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

  // ── On init: restore stored results ─────────────────────────────────────────
  const stored = loadStored();
  if (stored.length) {
    showState('results');
    renderGrid(stored);
    updateCounter(stored.length);
    if (stored.length >= WARN_AT) showStorageWarning(stored.length);
  }

  // ── Cluster plot stub ────────────────────────────────────────────────────────
  let clusterInitialised = false;

  function initClusterPlot() {
    if (clusterInitialised) return;
    clusterInitialised = true;

    fetch('assets/data/embeddings.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(data => {
        const plotEl      = document.getElementById('cluster-plot');
        const placeholder = document.querySelector('.viz-placeholder');
        const vizArea     = document.querySelector('.viz-area');

        if (placeholder) placeholder.style.display = 'none';
        if (vizArea)     vizArea.classList.remove('viz-area--empty');
        if (plotEl)      plotEl.style.display = 'block';

        // Uncomment once embeddings.json + Plotly are ready:
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
        //   font: { family: 'JetBrains Mono, monospace', color: '#8a8580', size: 11 },
        //   xaxis: { showgrid: false, zeroline: false, title: 'UMAP 1' },
        //   yaxis: { showgrid: false, zeroline: false, title: 'UMAP 2' },
        //   legend: { bgcolor: 'rgba(0,0,0,0)', bordercolor: 'rgba(180,160,100,0.15)' },
        //   margin: { l: 40, r: 20, t: 20, b: 40 }
        // };
        // Plotly.newPlot('cluster-plot', traces, layout, { responsive: true });
      })
      .catch(() => console.info('demo.js: embeddings.json not found.'));
  }
};

// Auto-init on first load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (document.getElementById('upload-zone')) window.initDemo();
  }, 100);
});
