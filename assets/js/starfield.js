/* ═══════════════════════════════════════════════════════════════
   starfield.js
   Draws the animated star/meteor background on a fixed canvas.
   Self-contained — no dependencies on other scripts.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Config ────────────────────────────────────────────────────
  const STAR_COUNT  = 260;
  const STAR_COLORS = ['#ffffff', '#e8e2d4', '#7aaed4', '#d4c87a', '#d47a7a'];

  let W, H, stars = [], meteors = [];

  // ── Helpers ───────────────────────────────────────────────────
  function rand(a, b) { return a + Math.random() * (b - a); }

  // ── Setup ─────────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x:     Math.random() * W,
        y:     Math.random() * H,
        r:     rand(0.2, 1.4),
        alpha: Math.random(),
        // Each star twinkles at its own speed and direction
        dAlpha: rand(0.0003, 0.0015) * (Math.random() < 0.5 ? 1 : -1),
        color:  STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
      });
    }
  }

  // ── Meteor spawning ───────────────────────────────────────────
  // Called every frame; low probability so meteors are rare.
  function maybeSpawnMeteor() {
    if (Math.random() > 0.003) return;
    meteors.push({
      x:     Math.random() * W,
      y:     Math.random() * H * 0.5,
      vx:    rand(2, 5),
      vy:    rand(1, 2.5),
      len:   rand(60, 140),
      life:  1,                     // fades from 1 → 0
      decay: rand(0.008, 0.02)
    });
  }

  // ── Draw loop ─────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Stars
    for (const s of stars) {
      s.alpha += s.dAlpha;
      if (s.alpha > 1 || s.alpha < 0) s.dAlpha *= -1;

      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
      ctx.fillStyle   = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Meteors
    maybeSpawnMeteor();
    meteors = meteors.filter(m => m.life > 0);

    for (const m of meteors) {
      const tailX = m.x - m.vx * m.len;
      const tailY = m.y - m.vy * m.len;

      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, `rgba(201,168,76,${m.life * 0.7})`);
      grad.addColorStop(1, 'rgba(201,168,76,0)');

      ctx.globalAlpha = m.life;
      ctx.strokeStyle = grad;
      ctx.lineWidth   = m.life * 1.5;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      m.x    += m.vx;
      m.y    += m.vy;
      m.life -= m.decay;
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  // ── Init ──────────────────────────────────────────────────────
  resize();
  initStars();
  draw();
  window.addEventListener('resize', () => { resize(); initStars(); });
})();
