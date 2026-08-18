/**
 * Hero backdrop: a 24-hour system load curve.
 *
 * Not decorative noise — the shape is the real one. Overnight trough, a
 * morning ramp as the grid wakes up, a midday shoulder that solar flattens,
 * and the evening peak when the sun drops and everyone gets home. The curve
 * draws itself once on load, then a current pulse runs the conductor.
 */

const HOURS = 24;

// Normalized load by hour, 0..1. Duck-curve shaped.
const LOAD = [
  0.34, 0.30, 0.28, 0.27, 0.28, 0.33,
  0.42, 0.52, 0.58, 0.56, 0.52, 0.49,
  0.47, 0.46, 0.48, 0.54, 0.65, 0.80,
  0.93, 1.00, 0.95, 0.82, 0.64, 0.46,
];

function smoothPath(pts) {
  // Catmull-Rom to cubic bezier. Keeps the ramp honest without corners.
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

export function mountLoadCurve(canvas) {
  if (!canvas) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let pts = [];
  let path = null;
  let start = null;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The curve occupies the lower band so headline type sits in clear air.
    const top = h * 0.42;
    const bottom = h * 0.94;
    pts = LOAD.map((v, i) => [
      (i / (HOURS - 1)) * w,
      bottom - v * (bottom - top),
    ]);
    path = new Path2D(smoothPath(pts));
  }

  function grid() {
    ctx.save();
    ctx.strokeStyle = "rgba(126, 163, 190, 0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= HOURS - 1; i += 3) {
      const x = Math.round((i / (HOURS - 1)) * w) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.3);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let r = 0; r <= 4; r++) {
      const y = Math.round(h * 0.42 + (r / 4) * (h * 0.52)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Hour ticks, small enough to read as instrumentation not as a chart.
    ctx.fillStyle = "rgba(111, 128, 144, 0.55)";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    for (let i = 0; i <= HOURS - 1; i += 6) {
      const x = (i / (HOURS - 1)) * w;
      const label = String(i).padStart(2, "0") + ":00";
      ctx.fillText(label, Math.min(x + 6, w - 44), h - 10);
    }
    ctx.restore();
  }

  function draw(progress) {
    ctx.clearRect(0, 0, w, h);
    grid();

    // Area under the curve. Generation, in amber.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w * progress, h);
    ctx.clip();

    const fill = new Path2D(smoothPath(pts));
    fill.lineTo(w, h);
    fill.lineTo(0, h);
    fill.closePath();
    const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
    grad.addColorStop(0, "rgba(247, 183, 51, 0.20)");
    grad.addColorStop(0.55, "rgba(247, 183, 51, 0.05)");
    grad.addColorStop(1, "rgba(247, 183, 51, 0)");
    ctx.fillStyle = grad;
    ctx.fill(fill);

    ctx.strokeStyle = "rgba(247, 183, 51, 0.9)";
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(247, 183, 51, 0.55)";
    ctx.shadowBlur = 14;
    ctx.stroke(path);
    ctx.restore();

    // The head of the trace: where the current is right now.
    if (progress < 1) {
      const idx = Math.min(pts.length - 1, Math.floor(progress * (pts.length - 1)));
      const next = pts[Math.min(idx + 1, pts.length - 1)];
      const cur = pts[idx];
      const t = progress * (pts.length - 1) - idx;
      const x = cur[0] + (next[0] - cur[0]) * t;
      const y = cur[1] + (next[1] - cur[1]) * t;
      ctx.save();
      ctx.fillStyle = "#3fd2e6";
      ctx.shadowColor = "#3fd2e6";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(ts) {
    if (start === null) start = ts;
    const progress = Math.min(1, (ts - start) / 1900);
    // easeOutCubic: fast ramp, settles into the peak.
    draw(1 - Math.pow(1 - progress, 3));
    if (progress < 1) requestAnimationFrame(frame);
  }

  layout();
  if (reduced) {
    draw(1);
  } else {
    requestAnimationFrame(frame);
  }

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      layout();
      draw(1);
    }, 140);
  });
}
