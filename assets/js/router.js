/* ═══════════════════════════════════════════════════════════════
   router.js
   Minimal SPA router for GitHub Pages.

   HOW IT WORKS
   ─────────────
   Each page lives as a standalone HTML fragment in pages/*.html.
   When the user clicks a nav link the router:
     1. Fetches the fragment (cached after first load)
     2. Injects it into #app
     3. Updates the active nav link
     4. Updates the URL hash
     5. Runs scroll-reveal on the new content

   TO ADD A NEW PAGE
   ──────────────────
   1. Create  pages/my-page.html
   2. Add a nav link with  data-page="my-page"
   3. That's it.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────
  // Valid page ids and their fragment files
  const PAGES = {
    home:  'pages/home.html',
    data:  'pages/data.html',
    demo:  'pages/demo.html',
    about: 'pages/about.html',
  };

  const DEFAULT_PAGE = 'home';

  // ── State ─────────────────────────────────────────────────────
  const cache       = {};      // { pageId: htmlString }
  const app         = document.getElementById('app');
  let   currentPage = null;

  // ── Fetch page fragment ───────────────────────────────────────
  async function loadPage(pageId) {
    if (cache[pageId]) return cache[pageId];

    try {
      const res  = await fetch(PAGES[pageId]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      cache[pageId] = html;
      return html;
    } catch (err) {
      console.error(`Router: failed to load page "${pageId}"`, err);
      return `<div class="content-wrapper content-wrapper--page">
                <p style="color:var(--text-muted);font-family:var(--font-mono)">
                  Could not load page. Make sure <code>pages/${pageId}.html</code> exists.
                </p>
              </div>`;
    }
  }

  // ── Navigate ──────────────────────────────────────────────────
  async function navigate(pageId) {
    if (!PAGES[pageId]) pageId = DEFAULT_PAGE;
    if (pageId === currentPage) return;

    // 1. Fetch
    const html = await loadPage(pageId);

    // 2. Inject
    app.innerHTML = html;
    currentPage   = pageId;

    // 3. Active nav link
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    // 4. Hash (doesn't cause a page reload on GitHub Pages)
    history.replaceState(null, '', pageId === DEFAULT_PAGE ? '.' : `#${pageId}`);

    // 5. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 6. Scroll-reveal
    requestAnimationFrame(setupReveal);

    // 7. Re-run page-specific init if demo.js is loaded
    if (pageId === 'demo' && typeof window.initDemo === 'function') {
      window.initDemo();
    }
  }

  // ── Scroll-reveal (IntersectionObserver) ─────────────────────
  function setupReveal() {
    const targets = app.querySelectorAll(
      '.pipeline__step, .result-card, .timeline__step, .resource-card'
    );
    targets.forEach(el => el.classList.add('reveal'));

    // threshold: 0 means trigger as soon as even 1px enters the viewport.
    // rootMargin expands the trigger zone so elements near the top of the
    // page (already in view on load) are revealed immediately.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => observer.observe(el));
  }

  // ── Event delegation (handles nav links + any data-page link
  //    inside page fragments, even after DOM replacement) ────────
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-page]');
    if (!el) return;
    e.preventDefault();
    navigate(el.dataset.page);
  });

  // ── Initial load ──────────────────────────────────────────────
  const hash    = window.location.hash.replace('#', '').trim();
  const startId = PAGES[hash] ? hash : DEFAULT_PAGE;
  navigate(startId);
})();
