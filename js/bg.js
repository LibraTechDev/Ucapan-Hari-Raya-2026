(function () {
  /* ============================================================
   bg.js — canvas background: floating petals + gold stars
   ============================================================ */

  const cv = document.getElementById("bgC");
  const ctx = cv.getContext("2d");
  let W, H;

  function resizeCanvas() {
    W = cv.width = innerWidth;
    H = cv.height = innerHeight;
  }
  resizeCanvas();
  addEventListener("resize", resizeCanvas);

  // ── Petal particles ──────────────────────────────────────────
  const PETAL_COLORS = [
    "#f9c5d1",
    "#f7b8ca",
    "#fce4ee",
    "#f4a8bf",
    "#fde8f4",
    "#f0b8cc",
    "#fad0dc",
  ];
  const pets = [];
  for (let i = 0; i < 30; i++) pets.push(newPetal(true));

  function newPetal(init) {
    const s = 7 + Math.random() * 15;
    return {
      x: Math.random() * innerWidth,
      y: init ? Math.random() * innerHeight : -s * 2,
      s,
      vy: 0.35 + Math.random() * 0.75,
      vx: (Math.random() - 0.5) * 0.35,
      r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.018,
      c: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      a: 0.35 + Math.random() * 0.5,
      rx: 0.5 + Math.random() * 0.35,
      ry: 0.8 + Math.random() * 0.18,
    };
  }

  // ── Gold star sparkles ───────────────────────────────────────
  const stars = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    ph: Math.random() * Math.PI * 2,
    sp: 0.007 + Math.random() * 0.013,
  }));

  // ── Render loop ──────────────────────────────────────────────
  function frame() {
    ctx.clearRect(0, 0, W, H);

    // Stars
    stars.forEach((s) => {
      s.ph += s.sp;
      const a = 0.25 + Math.sin(s.ph) * 0.25;
      const r = 2.5 + Math.sin(s.ph) * 0.5;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "#d4a853";
      ctx.lineWidth = 1.5;
      ctx.translate((s.x / 100) * W, (s.y / 100) * H);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Petals
    pets.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > H + 20) {
        pets[i] = newPetal();
        return;
      }
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s * p.rx, p.s * p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(frame);
  }
  frame();

  // ── CSS sparkle crosses ──────────────────────────────────────
  (function () {
    const positions = [
      [8, 12],
      [22, 6],
      [78, 9],
      [91, 15],
      [4, 42],
      [95, 38],
      [12, 72],
      [88, 68],
      [32, 88],
      [68, 85],
      [50, 4],
      [48, 95],
      [20, 55],
      [80, 50],
    ];
    positions.forEach(([l, t], i) => {
      const s = document.createElement("div");
      s.className = "spk";
      s.style.cssText = `left:${l}%;top:${t}%;width:8px;height:8px;animation-delay:${i * 0.22}s;animation-duration:${2 + Math.random() * 1.5}s`;
      document.body.appendChild(s);
    });
  })();
})();
