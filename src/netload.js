/**
 * Hero chart: the duck curve.
 *
 * Not wallpaper. This is the shape every person who works on the grid
 * recognizes on sight: gross demand through the day, solar eating the middle
 * out of it, and the evening ramp that everything else has to cover when the
 * sun drops. Axes carry units, the legend names both series, and the caption
 * says it is illustrative, because presenting an invented shape as measured
 * data would be the one unforgivable thing to do on a page about energy.
 *
 * Drawn on canvas rather than as SVG so the ramp can draw itself once on load
 * without shipping a chart library for a single figure.
 */

// Gigawatts by hour, a plausible spring day on a solar-heavy system.
const GROSS = [24,23,22,22,23,25,28,31,33,34,34,34,33,33,33,34,36,38,39,38,36,33,29,26];
const SOLAR = [ 0, 0, 0, 0, 0, 0, 1, 3, 6, 9,12,14,15,14,12, 9, 5, 2, 0, 0, 0, 0, 0, 0];
const NET = GROSS.map((g, i) => g - SOLAR[i]);

const Y_MAX = 45;
const Y_TICKS = [0, 15, 30, 45];
const X_TICKS = [0, 6, 12, 18, 23];

const PAD = { top: 16, right: 14, bottom: 30, left: 40 };

const INK = {
  grid: "rgba(126, 163, 190, 0.12)",
  axis: "rgba(126, 163, 190, 0.34)",
  label: "rgba(143, 160, 176, 0.9)",
  gross: "rgba(122, 160, 190, 0.75)",
  net: "#f7b733",
  solar: "rgba(247, 183, 51, 0.11)",
};

function catmullRom(pts) {
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d.push(
      `C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ` +
      `${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ` +
      `${p2[0]} ${p2[1]}`
    );
  }
  return d.join(" ");
}

export function mountNetLoad(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let plot = null;
  let grossPts = [];
  let netPts = [];
  let start = null;

  const xOf = (i) => plot.x + (i / 23) * plot.w;
  const yOf = (gw) => plot.y + plot.h - (gw / Y_MAX) * plot.h;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    plot = {
      x: PAD.left,
      y: PAD.top,
      w: Math.max(10, w - PAD.left - PAD.right),
      h: Math.max(10, h - PAD.top - PAD.bottom),
    };
    grossPts = GROSS.map((v, i) => [xOf(i), yOf(v)]);
    netPts = NET.map((v, i) => [xOf(i), yOf(v)]);
  }

  function axes() {
    ctx.save();
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = INK.label;
    ctx.lineWidth = 1;

    // Horizontal gridlines with the unit on the top tick only, so the axis
    // states GW once rather than repeating it four times.
    Y_TICKS.forEach((gw) => {
      const y = Math.round(yOf(gw)) + 0.5;
      ctx.strokeStyle = INK.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(gw === Y_MAX ? `${gw} GW` : String(gw), plot.x - 8, y);
    });

    X_TICKS.forEach((hr) => {
      const x = Math.round(xOf(hr)) + 0.5;
      ctx.strokeStyle = INK.grid;
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.stroke();
      ctx.textAlign = hr === 0 ? "left" : hr === 23 ? "right" : "center";
      ctx.textBaseline = "top";
      ctx.fillText(`${String(hr).padStart(2, "0")}:00`, x, plot.y + plot.h + 9);
    });

    ctx.strokeStyle = INK.axis;
    ctx.beginPath();
    ctx.moveTo(plot.x + 0.5, plot.y);
    ctx.lineTo(plot.x + 0.5, plot.y + plot.h + 0.5);
    ctx.lineTo(plot.x + plot.w, plot.y + plot.h + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function draw(progress) {
    ctx.clearRect(0, 0, w, h);
    axes();

    // The gap between the two curves IS the solar, so it is filled rather
    // than drawn as a third line nobody would read.
    const band = new Path2D(catmullRom(grossPts));
    const back = [...netPts].reverse();
    band.lineTo(back[0][0], back[0][1]);
    const rev = catmullRom(back);
    band.addPath(new Path2D(rev));
    band.closePath();
    ctx.fillStyle = INK.solar;
    ctx.fill(band);

    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = INK.gross;
    ctx.stroke(new Path2D(catmullRom(grossPts)));
    ctx.setLineDash([]);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, plot.x + plot.w * progress, h);
    ctx.clip();
    ctx.strokeStyle = INK.net;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(catmullRom(netPts)));
    ctx.restore();

    // Mark the evening peak once the trace reaches it. The ramp into it is
    // the whole reason this shape is worth showing.
    if (progress > 0.86) {
      const pk = netPts[18];
      ctx.save();
      ctx.fillStyle = INK.net;
      ctx.beginPath();
      ctx.arc(pk[0], pk[1], 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = INK.label;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      // Above the point, not beside it. The ramp climbs into this spot from
      // the left, so anything level with the marker lands on the curve.
      ctx.fillText("evening peak", pk[0] + 6, pk[1] - 11);
      ctx.restore();
    }
  }

  function frame(ts) {
    if (start === null) start = ts;
    const t = Math.min(1, (ts - start) / 2000);
    draw(1 - Math.pow(1 - t, 3));
    if (t < 1) requestAnimationFrame(frame);
  }

  function run() {
    layout();
    if (reduced) {
      draw(1);
    } else {
      start = null;
      requestAnimationFrame(frame);
    }
  }

  // Axis labels are monospace; drawing before the face loads renders them in
  // a fallback and never repaints.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  } else {
    run();
  }

  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      layout();
      draw(1);
    }, 140);
  });
}
