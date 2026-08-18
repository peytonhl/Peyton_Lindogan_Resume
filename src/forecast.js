/**
 * Hero figure: forecast against actuals.
 *
 * This is the output of the data product Peyton leads, not a stock industry
 * picture. A plan, a forecast range that widens the further out it reaches,
 * and the actual tracking through it. The month the actual leaves the range
 * is the month somebody needs to know, and finding that month is the entire
 * point of the product.
 *
 * The axis is INDEXED TO PLAN rather than denominated in dollars. That is
 * the same rule the rest of the page follows, made visible: the figures live
 * in the resume, not on the open web. Indexing is also how the work is
 * actually discussed, so nothing is lost by it.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Percent of plan. 100 is on plan.
const ACTUAL = [100.5, 99.2, 101.8, 102.6, 102.4, 100.9, 99.4, 95.0, 93.4, 96.5, 98.1, 99.3];

// The forecast range widens with the horizon, because a forecast twelve
// months out is not the same claim as one made for next month.
const HALF = [1.2, 1.8, 2.4, 3.0, 3.5, 4.0, 4.4, 4.8, 5.2, 5.5, 5.8, 6.0];

const PLAN = 100;
const Y_MIN = 88;
const Y_MAX = 112;
const Y_TICKS = [90, 100, 110];
const X_TICKS = [0, 3, 6, 9, 11];

const PAD = { top: 18, right: 16, bottom: 30, left: 40 };

const INK = {
  grid: "rgba(126, 163, 190, 0.12)",
  axis: "rgba(126, 163, 190, 0.34)",
  label: "rgba(143, 160, 176, 0.9)",
  band: "rgba(122, 160, 190, 0.07)",
  bandEdge: "rgba(122, 160, 190, 0.5)",
  plan: "rgba(160, 180, 198, 0.55)",
  actual: "#f7b733",
  breach: "rgba(247, 183, 51, 0.28)",
};

// One continuous subpath: out along the top edge, back along the bottom.
// Two subpaths plus a nonzero fill leaves a wedge where they join.
function closedBand(hi, lo) {
  const back = curve([...lo].reverse()).replace(/^M\s*([-\d.]+)\s+([-\d.]+)/, "L $1 $2");
  return new Path2D(`${curve(hi)} ${back} Z`);
}

function curve(pts) {
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

export function mountForecast(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let plot = null;
  let hiPts = [];
  let loPts = [];
  let actPts = [];
  let start = null;

  const xOf = (i) => plot.x + (i / (MONTHS.length - 1)) * plot.w;
  const yOf = (v) => plot.y + plot.h - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * plot.h;

  // First month the actual falls outside the forecast range.
  const breachAt = ACTUAL.findIndex((v, i) => Math.abs(v - PLAN) > HALF[i]);

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
    hiPts = HALF.map((d, i) => [xOf(i), yOf(PLAN + d)]);
    loPts = HALF.map((d, i) => [xOf(i), yOf(PLAN - d)]);
    actPts = ACTUAL.map((v, i) => [xOf(i), yOf(v)]);
  }

  function axes() {
    ctx.save();
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = INK.label;
    ctx.lineWidth = 1;

    Y_TICKS.forEach((v) => {
      const y = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = INK.grid;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(v === PLAN ? "100" : String(v), plot.x - 8, y);
    });

    X_TICKS.forEach((i) => {
      const x = Math.round(xOf(i)) + 0.5;
      ctx.strokeStyle = INK.grid;
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.stroke();
      ctx.textAlign = i === 0 ? "left" : i === MONTHS.length - 1 ? "right" : "center";
      ctx.textBaseline = "top";
      ctx.fillText(MONTHS[i], x, plot.y + plot.h + 9);
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

    // Forecast range: one closed shape, top edge out and bottom edge back.
    ctx.fillStyle = INK.band;
    ctx.fill(closedBand(hiPts, loPts));

    ctx.strokeStyle = INK.bandEdge;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke(new Path2D(curve(hiPts)));
    ctx.stroke(new Path2D(curve(loPts)));
    ctx.setLineDash([]);

    // Plan itself.
    const py = Math.round(yOf(PLAN)) + 0.5;
    ctx.strokeStyle = INK.plan;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    ctx.moveTo(plot.x, py);
    ctx.lineTo(plot.x + plot.w, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // The variance itself: the gap between the actual and the edge it crossed,
    // drawn per contiguous run so months inside the range stay unshaded.
    const runs = [];
    for (let i = 0; i < ACTUAL.length; i++) {
      const out = Math.abs(ACTUAL[i] - PLAN) > HALF[i];
      if (!out) continue;
      const last = runs[runs.length - 1];
      if (last && last.end === i - 1) last.end = i;
      else runs.push({ start: i, end: i, above: ACTUAL[i] > PLAN });
    }
    runs.forEach(({ start: a, end: b, above }) => {
      const edge = above ? hiPts : loPts;
      const gap = new Path2D();
      gap.moveTo(actPts[a][0], actPts[a][1]);
      for (let i = a; i <= b; i++) gap.lineTo(actPts[i][0], actPts[i][1]);
      for (let i = b; i >= a; i--) gap.lineTo(edge[i][0], edge[i][1]);
      gap.closePath();
      ctx.fillStyle = INK.breach;
      ctx.fill(gap);
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, plot.x + plot.w * progress, h);
    ctx.clip();
    ctx.strokeStyle = INK.actual;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke(new Path2D(curve(actPts)));
    ctx.restore();

    // Mark where the forecast stopped holding.
    const reach = plot.x + plot.w * progress;
    if (breachAt >= 0 && actPts[breachAt][0] <= reach) {
      const p = actPts[breachAt];
      ctx.save();
      ctx.fillStyle = INK.actual;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3.2, 0, Math.PI * 2);
      ctx.fill();
      const labelY = yOf(Y_MIN + 1.6);
      ctx.strokeStyle = "rgba(126, 163, 190, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p[0] + 0.5, p[1] + 6);
      ctx.lineTo(p[0] + 0.5, labelY - 4);
      ctx.stroke();
      ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = INK.label;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("variance flagged", p[0], labelY);
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
