/* ============================================================
   TIJORAT MARKAZI — panel charts built from real records

   No library and no build step: the series is computed from the
   records the panel already holds, then rendered as inline SVG.

   The rule this file exists to enforce: if there is no data, the
   chart draws a flat line at zero. It never invents a shape.
   ============================================================ */

/* Short month names for axis labels, so each panel does not need its
   own copy. Falls back to the month number for an unknown language. */
var KG_MONTHS = {
  uz: ["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],
  ru: ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
};
function kgMonthLabel(m, lang) {
  var names = KG_MONTHS[lang] || KG_MONTHS.en;
  return names[m] || String(m + 1);
}

/**
 * Bucket records into one entry per month and accumulate them.
 *
 * Records with no usable timestamp are not dropped and not given a
 * fake date — they are counted as "already existing" before the
 * window opens, so the final cumulative total still matches the real
 * record count. `undated` reports how many those were.
 *
 * @param {Array<object>} items    records to bucket
 * @param {object} [opts]
 * @param {number} [opts.months=12]      how many months back to cover
 * @param {string} [opts.dateKey=created] field holding the timestamp
 * @param {number} [opts.now]            override "today" (for tests)
 * @returns {{buckets:Array<{y:number,m:number,added:number,total:number}>,
 *            undated:number, total:number}}
 */
function kgMonthlySeries(items, opts) {
  opts = opts || {};
  var months = opts.months || 12;
  var key = opts.dateKey || "created";
  var now = opts.now ? new Date(opts.now) : new Date();
  var list = Array.isArray(items) ? items : [];

  var buckets = [];
  for (var i = months - 1; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ y: d.getFullYear(), m: d.getMonth(), added: 0, total: 0 });
  }
  var windowStart = new Date(buckets[0].y, buckets[0].m, 1).getTime();

  var carried = 0, undated = 0;
  for (var j = 0; j < list.length; j++) {
    var raw = list[j] ? list[j][key] : null;
    var ts = typeof raw === "number" ? raw : (raw ? Date.parse(raw) : NaN);
    if (isNaN(ts)) { undated++; carried++; continue; }
    if (ts < windowStart) { carried++; continue; }
    var t = new Date(ts);
    for (var b = 0; b < buckets.length; b++) {
      if (buckets[b].y === t.getFullYear() && buckets[b].m === t.getMonth()) {
        buckets[b].added++;
        break;
      }
    }
  }

  var running = carried;
  for (var k = 0; k < buckets.length; k++) {
    running += buckets[k].added;
    buckets[k].total = running;
  }
  return { buckets: buckets, undated: undated, total: running };
}

/**
 * Render a cumulative area chart. Straight segments between real
 * points — no smoothing, because a curve through sparse data implies
 * values that were never measured.
 *
 * @param {Array<{label:string,total:number,added:number}>} points
 * @param {object} [opts]
 * @param {string} [opts.ariaLabel]  spoken summary of the chart
 * @param {string} [opts.emptyText]  shown when every value is zero
 * @returns {string} SVG markup
 */
function kgAreaChart(points, opts) {
  opts = opts || {};
  var pts = Array.isArray(points) ? points : [];
  if (!pts.length) return "";

  var W = 800, H = 190, padL = 44, padR = 14, padT = 14, padB = 30;
  var plotW = W - padL - padR, plotH = H - padT - padB;

  var peak = 0;
  for (var i = 0; i < pts.length; i++) peak = Math.max(peak, pts[i].total || 0);
  // A zero-height scale would divide by zero; a flat baseline is the
  // honest picture when nothing has been created yet.
  var scaleMax = peak > 0 ? peak : 1;

  var x = function (i) {
    return pts.length === 1 ? padL + plotW / 2
      : padL + (i / (pts.length - 1)) * plotW;
  };
  var y = function (v) { return padT + plotH - (v / scaleMax) * plotH; };

  var line = "", dots = "", labels = "";
  for (var p = 0; p < pts.length; p++) {
    var px = x(p).toFixed(1), py = y(pts[p].total || 0).toFixed(1);
    line += (p ? " L" : "M") + px + "," + py;
    dots += '<circle cx="' + px + '" cy="' + py + '" r="3.5" fill="currentColor"/>';
    // Label every other month so they never collide at narrow widths.
    if (p % 2 === (pts.length - 1) % 2) {
      labels += '<text x="' + px + '" y="' + (H - 9) +
        '" text-anchor="middle" font-size="11" fill="var(--muted)">' + pts[p].label + "</text>";
    }
  }
  var area = line + " L" + x(pts.length - 1).toFixed(1) + "," + (padT + plotH) +
             " L" + x(0).toFixed(1) + "," + (padT + plotH) + " Z";

  // Three gridlines: floor, midpoint, peak.
  var grid = "", ticks = [0, scaleMax / 2, scaleMax];
  for (var g = 0; g < ticks.length; g++) {
    var gy = y(ticks[g]).toFixed(1);
    grid += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy + '" y2="' + gy +
            '" stroke="var(--line)" stroke-width="1"/>' +
            '<text x="' + (padL - 9) + '" y="' + (+gy + 4) +
            '" text-anchor="end" font-size="11" fill="var(--muted)">' +
            (peak > 0 ? Math.round(ticks[g]) : g === 0 ? 0 : "") + "</text>";
  }

  var gid = "kgt" + Math.random().toString(36).slice(2, 8);
  var empty = peak === 0 && opts.emptyText
    ? '<text x="' + (padL + plotW / 2) + '" y="' + (padT + plotH / 2) +
      '" text-anchor="middle" font-size="13" fill="var(--muted)">' + opts.emptyText + "</text>"
    : "";

  return '<svg viewBox="0 0 ' + W + " " + H + '" role="img"' +
    (opts.ariaLabel ? ' aria-label="' + String(opts.ariaLabel).replace(/"/g, "&quot;") + '"' : "") +
    ' style="width:100%;height:auto;display:block;color:var(--navy);overflow:visible">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="currentColor" stop-opacity=".22"/>' +
    '<stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>' +
    grid +
    '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
    '<path d="' + line + '" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linejoin="round" stroke-linecap="round"/>' +
    dots + labels + empty +
    "</svg>";
}
