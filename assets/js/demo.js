/* ═══════════════════════════════════════════════════════════════
   demo.js

   Features:
     • Client-side dedup — already-processed filenames are filtered
       OUT before anything is sent to the server
     • Grid stays fully visible while new files are being processed
       (spinner appears above the grid, not instead of it)
     • Wake-up: pings /ping repeatedly until the server responds,
       with a live countdown so the user knows what is happening
     • 5-minute total timeout for the predict request
     • Results persist in localStorage across page refreshes
     • At 45/50 predictions: warning banner + Download & Clear
     • At 50: auto-downloads CSV + images zip, then resets
═══════════════════════════════════════════════════════════════ */

const API_URL     = 'https://tfg-website-backend-production.up.railway.app';
const STORAGE_KEY = 'meteor_predictions_v1';
const MAX_STORED  = 50;
const WARN_AT     = 45;

// Timeout constants (ms)
const WAKE_PING_INTERVAL = 3000;   // ping /ping every 3s while waking
const WAKE_MAX_WAIT      = 90000;  // give up waking after 90s
const PREDICT_TIMEOUT    = 300000; // 5 minutes for the actual predict call

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
    } catch { return []; }
  }

  function saveStored(results) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (e) {
      console.warn('localStorage full:', e);
      triggerDownloadAndClear();
    }
  }

  function clearStored() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function storedFilenames() {
    return new Set(loadStored().map(r => r.filename));
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
    fileInput.value = '';
  });

  // ── File handling — filter duplicates BEFORE sending ───────────────────────
  async function handleFiles(fileList) {
    const files    = Array.from(fileList);
    const known    = storedFilenames();
    const label    = zone.querySelector('.upload-zone__primary');

    // Detect stems already in storage
    // For a zip we can't inspect contents here, so always send zips
    const isZip    = files.some(f => f.name.toLowerCase().endsWith('.zip'));

    if (!isZip) {
      // For loose files, filter out AVIs whose stem is already stored
      const avis     = files.filter(f => f.name.toLowerCase().endsWith('.avi'));
      const xmls     = files.filter(f => f.name.toLowerCase().endsWith('.xml'));
      const newAvis  = avis.filter(f => !known.has(stem(f.name)));
      const newXmls  = xmls.filter(f => newAvis.some(a => stem(a.name) === stem(f.name)));
      const skipped  = avis.length - newAvis.length;

      if (skipped > 0 && label)
        label.textContent = `✦  ${skipped} already processed — skipping`;

      if (!newAvis.length) {
        // Everything was a duplicate — nothing to send
        if (label) label.textContent = `✦  All files already processed`;
        return;
      }

      if (label) label.textContent =
        `✦  ${newAvis.length} video(s) · ${newXmls.length} XML(s)` +
        (skipped ? ` · ${skipped} skipped` : '');

      await submitFiles([...newAvis, ...newXmls]);
    } else {
      if (label) label.textContent = `✦  ${files[0].name}`;
      await submitFiles(files);
    }
  }

  function stem(filename) {
    return filename.replace(/\.[^.]+$/, '');
  }

  // ── Wake-up: ping /ping until server responds ───────────────────────────────
  async function waitForServer(onStatusUpdate) {
    const start = Date.now();

    while (Date.now() - start < WAKE_MAX_WAIT) {
      try {
        const res = await fetch(`${API_URL}/ping`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) return true;   // server is up
      } catch { /* still sleeping */ }

      const elapsed  = Math.round((Date.now() - start) / 1000);
      const remaining = Math.round((WAKE_MAX_WAIT - (Date.now() - start)) / 1000);
      onStatusUpdate(`Server is waking up\u2026 ${elapsed}s elapsed (up to ${remaining}s remaining)`);

      await new Promise(r => setTimeout(r, WAKE_PING_INTERVAL));
    }

    return false;   // timed out
  }

  // ── API call ────────────────────────────────────────────────────────────────
  async function submitFiles(files) {
    const loadingMsg = document.getElementById('loading-message');

    showLoading(true);

    // Phase 1: wake the server
    if (loadingMsg) loadingMsg.textContent = 'Connecting to server\u2026';
    const alive = await waitForServer(msg => {
      if (loadingMsg) loadingMsg.textContent = msg;
    });

    if (!alive) {
      showLoading(false);
      showError('Server did not respond after 90 seconds. Please try again.');
      return;
    }

    // Phase 2: send files
    if (loadingMsg) loadingMsg.textContent = 'Processing recordings\u2026 (this may take a minute)';

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), PREDICT_TIMEOUT);

      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body:   formData,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 503) {
        showLoading(false);
        showError('Model weights are not loaded on the server. Check backend/README.md.');
        return;
      }
      if (!res.ok) {
        showLoading(false);
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        showError(err.detail || `Server error (${res.status}).`);
        return;
      }

      const data = await res.json();
      showLoading(false);
      appendResults(data.results, data.n_skipped, data.skipped);

    } catch (err) {
      showLoading(false);
      if (err.name === 'AbortError') {
        showError('Request timed out after 5 minutes. Try with fewer files, or check the server logs.');
      } else if (err.name === 'TypeError') {
        showError(`Cannot reach the backend. Check your connection or the Railway status.`);
      } else {
        showError(`Unexpected error: ${err.message}`);
      }
    }
  }

  // ── Loading overlay (above grid, not replacing it) ──────────────────────────
  function showLoading(visible) {
    const el = document.getElementById('results-loading');
    if (el) el.style.display = visible ? 'flex' : 'none';
    // Do NOT hide the grid — let existing cards stay visible
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  function showError(message) {
    const el = document.getElementById('results-error');
    const mg = document.getElementById('error-message');
    if (el) el.style.display = 'flex';
    if (mg) mg.textContent = message;
  }

  function hideError() {
    const el = document.getElementById('results-error');
    if (el) el.style.display = 'none';
  }

  // ── Append new results ──────────────────────────────────────────────────────
  function appendResults(newResults, nSkipped, skipped) {
    hideError();

    const stored   = loadStored();
    const existing = new Set(stored.map(r => r.filename));
    let added = 0, duplicate = 0;

    for (const r of newResults) {
      if (existing.has(r.filename)) { duplicate++; continue; }
      stored.push(r);
      existing.add(r.filename);
      added++;
    }

    saveStored(stored);
    renderGrid(stored);
    updateCounter(stored.length);

    // Make sure grid section is visible
    const grid = document.getElementById('results-grid-section');
    if (grid) grid.style.display = 'block';

    // Update upload zone label
    const label = zone.querySelector('.upload-zone__primary');
    let msg = added ? `✦  ${added} added` : '✦  Nothing new to add';
    if (duplicate) msg += ` · ${duplicate} already stored`;
    if (nSkipped)  msg += ` · ${nSkipped} failed`;
    if (label) label.textContent = msg;

    if (stored.length >= MAX_STORED) {
      triggerDownloadAndClear();
    } else if (stored.length >= WARN_AT) {
      showStorageWarning(stored.length);
    }
  }

  // ── Render full grid ────────────────────────────────────────────────────────
  function renderGrid(results) {
    const gridEl = document.getElementById('results-grid');
    if (!gridEl) return;

    gridEl.innerHTML = '';

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

  function updateSummary(results) {
    const el = document.getElementById('results-summary');
    if (!el) return;
    const meteors    = results.filter(r => r.predicted_class === 'meteor').length;
    const nonMeteors = results.filter(r => r.predicted_class === 'non-meteor').length;
    el.innerHTML =
      `<span class="summary-stat"><strong>${results.length}</strong> total</span>` +
      `<span class="summary-divider">&middot;</span>` +
      `<span class="summary-stat meteor-stat"><strong>${meteors}</strong> meteor${meteors !== 1 ? 's' : ''}</span>` +
      `<span class="summary-divider">&middot;</span>` +
      `<span class="summary-stat non-stat"><strong>${nonMeteors}</strong> non-meteor${nonMeteors !== 1 ? 's' : ''}</span>`;
  }

  function updateCounter(count) {
    const el = document.getElementById('storage-counter');
    if (!el) return;
    el.textContent = `${count} / ${MAX_STORED} stored`;
    el.className   = 'storage-counter' +
      (count >= MAX_STORED ? ' storage-counter--full' :
       count >= WARN_AT    ? ' storage-counter--warn' : '');
  }

  function showStorageWarning(count) {
    const el  = document.getElementById('storage-warning');
    const msg = document.getElementById('storage-warning-msg');
    if (el)  el.style.display = 'flex';
    if (msg) msg.textContent  =
      `${count} of ${MAX_STORED} predictions stored. Download before the limit is reached.`;
  }

  async function triggerDownloadAndClear() {
    const stored = loadStored();
    if (!stored.length) return;
    const el  = document.getElementById('storage-warning');
    const msg = document.getElementById('storage-warning-msg');
    if (el)  el.style.display = 'flex';
    if (msg) msg.textContent  = `Limit reached (${MAX_STORED}). Downloading results\u2026`;
    downloadCSV(stored);
    await downloadImagesZip(stored);
    setTimeout(() => {
      clearStored();
      renderGrid([]);
      updateCounter(0);
      if (el) el.style.display = 'none';
      const grid = document.getElementById('results-grid-section');
      if (grid) grid.style.display = 'none';
      const label = zone.querySelector('.upload-zone__primary');
      if (label) label.textContent = 'Drop files or a .zip here';
    }, 1500);
  }

  // ── Downloads ───────────────────────────────────────────────────────────────
  function downloadCSV(results) {
    const rows = [
      ['filename','predicted_class','confidence','prob_meteor','prob_non_meteor'].join(','),
      ...results.map(r => [
        r.filename, r.predicted_class, r.confidence,
        r.probabilities['meteor'] ?? '',
        r.probabilities['non-meteor'] ?? '',
      ].join(','))
    ];
    downloadBlob(rows.join('\n'), 'predictions.csv', 'text/csv');
  }

  async function downloadImagesZip(results) {
    if (!window.JSZip)
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    const zip = new window.JSZip();
    results.forEach(r => zip.file(`${r.filename}_${r.predicted_class}.png`, r.image_b64, { base64: true }));
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'cropped_images.zip', 'application/zip');
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── Button wiring ────────────────────────────────────────────────────────────
  document.getElementById('btn-download-csv')?.addEventListener('click', () => {
    const s = loadStored(); if (s.length) downloadCSV(s);
  });
  document.getElementById('btn-download-images')?.addEventListener('click', async () => {
    const s = loadStored(); if (s.length) await downloadImagesZip(s);
  });
  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (!confirm('Clear all stored predictions? This cannot be undone.')) return;
    clearStored();
    renderGrid([]);
    updateCounter(0);
    const grid = document.getElementById('results-grid-section');
    if (grid) grid.style.display = 'none';
    const warn = document.getElementById('storage-warning');
    if (warn) warn.style.display = 'none';
    const label = zone.querySelector('.upload-zone__primary');
    if (label) label.textContent = 'Drop files or a .zip here';
  });
  document.getElementById('btn-download-and-clear')?.addEventListener('click', async () => {
    await triggerDownloadAndClear();
  });

  // ── On init: restore stored results ─────────────────────────────────────────
  const stored = loadStored();
  if (stored.length) {
    const grid = document.getElementById('results-grid-section');
    if (grid) grid.style.display = 'block';
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
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => {
        const plotEl      = document.getElementById('cluster-plot');
        const placeholder = document.querySelector('.viz-placeholder');
        const vizArea     = document.querySelector('.viz-area');
        if (placeholder) placeholder.style.display = 'none';
        if (vizArea)     vizArea.classList.remove('viz-area--empty');
        if (plotEl)      plotEl.style.display = 'block';
      })
      .catch(() => console.info('demo.js: embeddings.json not found.'));
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (document.getElementById('upload-zone')) window.initDemo();
  }, 100);
});
