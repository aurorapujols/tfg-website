/* ═══════════════════════════════════════════════════════════════
   components.js
   Renders the shared navigation and footer into their mount points.
   Edit the HTML strings here to update the nav/footer across all pages.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Navigation HTML ──────────────────────────────────────────
  // data-page attributes are picked up by router.js for page switching.
  const NAV_HTML = `
    <nav id="main-nav">
      <div class="nav__inner">

        <a class="nav__logo" data-page="home">
          <span class="nav__logo-glyph">✦</span>
          <span class="nav__logo-text">TFG · 2026 · Mathematical Engineering on Data Science</span>
        </a>

        <ul class="nav__links" id="nav-links">
          <li><a class="nav__link" data-page="home">Overview</a></li>
          <li><a class="nav__link" data-page="data">Dataset</a></li>
          <li><a class="nav__link" data-page="demo">Demo</a></li>
          <li><a class="nav__link" data-page="about">About</a></li>
          <li>
            <a class="nav__cta"
               href="https://github.com/aurorapujols/treball-final-de-grau"
               target="_blank"
               rel="noopener">
              <!-- GitHub icon -->
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18
                         6.839 9.504.5.092.682-.217.682-.483
                         0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343
                         -.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608
                         1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832
                         .092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951
                         0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65
                         0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844
                         c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027
                         .546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688
                         0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855
                         0 1.338-.012 2.419-.012 2.747
                         0 .268.18.58.688.482A10.019 10.019 0 0022 12.017
                         C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </a>
          </li>
        </ul>

        <button class="nav__hamburger" id="nav-hamburger" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>

      </div>
    </nav>`;

  // ── Footer HTML ───────────────────────────────────────────────
  const FOOTER_HTML = `
    <footer id="site-footer">
      <div class="footer__inner">
        <p>
          <strong>Contrastive Self-Supervised Learning for Astronomical Phenomena Identification</strong><br>
          Final Degree Project · AURORA Pujols Rial · Universitat Pompeu Fabra · 2026
        </p>
        <p class="footer__copy">
          Built with Claude.ai &nbsp;·&nbsp; Backend Deployed with Railway &nbsp;·&nbsp; Hosted on GitHub Pages
        </p>
      </div>
    </footer>`;

  // ── Mount ─────────────────────────────────────────────────────
  const navMount    = document.getElementById('nav-mount');
  const footerMount = document.getElementById('footer-mount');

  if (navMount)    navMount.innerHTML    = NAV_HTML;
  if (footerMount) footerMount.innerHTML = FOOTER_HTML;

  // ── Mobile hamburger ──────────────────────────────────────────
  // Delegated — waits until the nav is in the DOM (it just was).
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks  = document.getElementById('nav-links');

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks?.classList.toggle('open');
  });

  // Close mobile nav when any link is tapped
  navLinks?.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    navLinks.classList.remove('open');
  });
})();
