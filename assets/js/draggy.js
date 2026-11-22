/* draggy: loose pieces. The pieces of a page float: grab one with the
   mouse and it comes a little way out of place, shoulders its neighbours aside, and when
   let go drifts slowly back to where it belongs.

   Which elements are pieces, and how they move, comes from [draggy] in
   config/_default/params.toml; anything not set there falls back to DEFAULTS below.
   Any element can also opt in with data-draggy, or opt out with data-draggy="off".
   A piece inside another piece is left alone, so pick whole blocks.

   It moves things with the CSS `translate` property, which adds to whatever transform an
   element already has (tilted tape, stickers), and puts everything back exactly when
   switched off with draggy.toggle(false). Touch is left to scrolling: pieces answer to a mouse or a pen.

   To try settings live, in the browser console:
     draggy.config.reach = 160; draggy.config.spring = 0.0008
     draggy.toggle(false); draggy.toggle(true)   // re-collect the pieces
*/
(function () {
  "use strict";

  var DEFAULTS = {
    on: true,            // false keeps every page still
    page: ".home",       // only pages containing this have loose pieces ("" for every page)
    reach: 90,           // px: how far a piece will come; it resists more the further you pull
    spring: 0.0015,      // how hard home pulls a piece back, per tick (60 a second)
    damping: 0.94,       // velocity kept each tick; lower settles sooner, higher wobbles more
    shove: 0.6,          // how much of an overlap the bumped piece gives way, per frame
    give: 2.2,           // a shoved piece may go this many reaches from home
    pieces: "[data-draggy]",
    ignore: "button, input, select, textarea, canvas, video, audio, iframe, summary, label, [contenteditable], [data-draggy-ignore]"
  };

  var user = window.DRAGGY || {}, config = {};
  Object.keys(DEFAULTS).forEach(function (k) { config[k] = k in user ? user[k] : DEFAULTS[k]; });

  var root = document.documentElement, reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var pieces = [], on = false, raf = 0, held = null;

  function Piece(el) { this.el = el; this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.home = null; }
  Piece.prototype.paint = function () {
    this.el.style.translate = (Math.abs(this.x) < 0.05 && Math.abs(this.y) < 0.05) ? "" : this.x.toFixed(2) + "px " + this.y.toFixed(2) + "px";
  };

  function collect() {
    var sel = config.pieces + ", [data-draggy]";
    var els = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (el) {
      if (el.getAttribute("data-draggy") === "off" || !el.getClientRects().length) return false;
      var cs = getComputedStyle(el);
      return cs.position !== "fixed" && cs.position !== "sticky";
    });
    // a piece inside another piece would fight it: keep the outermost
    els = els.filter(function (el) { return !els.some(function (o) { return o !== el && o.contains(el); }); });
    return els.map(function (el) { return new Piece(el); });
  }

  /* Where each piece sits at rest, in page coordinates, shrunk a little so neighbours that
     merely touch do not count as colliding. */
  function measure() {
    var sx = window.scrollX, sy = window.scrollY;
    pieces.forEach(function (p) {
      var r = p.el.getBoundingClientRect(), i = Math.min(6, r.width / 4, r.height / 4);
      p.home = { l: r.left + sx - p.x + i, t: r.top + sy - p.y + i, r: r.right + sx - p.x - i, b: r.bottom + sy - p.y - i };
    });
  }
  function overlap(a, ax, ay, b, bx, by) {
    var w = Math.min(a.r + ax, b.r + bx) - Math.max(a.l + ax, b.l + bx);
    var h = Math.min(a.b + ay, b.b + by) - Math.max(a.t + ay, b.t + by);
    return w > 0 && h > 0 ? [w, h] : null;
  }

  /* The physics runs in fixed 60-a-second ticks, so a 120 Hz screen does not drift home twice as fast. */
  var acc = 0, last = 0;
  function step(now) {
    raf = 0;
    acc = Math.min(acc + (last ? now - last : 16.7), 100); last = now;
    var moving = false;
    while (acc >= 16.7) { acc -= 16.7; tick(); }
    for (var i = 0; i < pieces.length; i++) {
      var q = pieces[i];
      if (q === held || Math.abs(q.x) + Math.abs(q.y) > 0.05 || Math.abs(q.vx) + Math.abs(q.vy) > 0.02) moving = true;
      else { q.x = q.y = q.vx = q.vy = 0; }
      q.paint();
    }
    if (moving) raf = requestAnimationFrame(step); else last = 0;
  }
  function tick() {
    var k = config.spring, d = config.damping, n = pieces.length, i, j;
    for (i = 0; i < n; i++) {
      var p = pieces[i];
      if (p === held) continue;
      if (reduce.matches) { p.x = p.y = p.vx = p.vy = 0; continue; }
      p.vx = (p.vx - k * p.x) * d; p.vy = (p.vy - k * p.y) * d;
      p.x += p.vx; p.y += p.vy;
    }
    // collisions: only overlap that is new since rest counts, and the held piece never yields
    for (var pass = 0; pass < 2; pass++) for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      var a = pieces[i], b = pieces[j];
      if (!a.home || !b.home || (a.x === 0 && a.y === 0 && b.x === 0 && b.y === 0)) continue;
      var now = overlap(a.home, a.x, a.y, b.home, b.x, b.y); if (!now) continue;
      var rest = overlap(a.home, 0, 0, b.home, 0, 0) || [0, 0];
      var ew = now[0] - rest[0], eh = now[1] - rest[1]; if (ew <= 0.5 || eh <= 0.5) continue;
      // push apart along the axis that needs least
      var cxA = (a.home.l + a.home.r) / 2 + a.x, cxB = (b.home.l + b.home.r) / 2 + b.x;
      var cyA = (a.home.t + a.home.b) / 2 + a.y, cyB = (b.home.t + b.home.b) / 2 + b.y;
      var dx = 0, dy = 0;
      if (ew < eh) dx = (cxB >= cxA ? 1 : -1) * ew; else dy = (cyB >= cyA ? 1 : -1) * eh;
      var s = config.shove, wa = a === held ? 0 : b === held ? 1 : 0.5, wb = 1 - wa;
      a.x -= dx * s * wa; a.y -= dy * s * wa; b.x += dx * s * wb; b.y += dy * s * wb;
      a.vx -= dx * 0.05 * wa; a.vy -= dy * 0.05 * wa; b.vx += dx * 0.05 * wb; b.vy += dy * 0.05 * wb;
    }
    var lim = config.reach * config.give;
    for (i = 0; i < n; i++) {
      var q = pieces[i], r = Math.sqrt(q.x * q.x + q.y * q.y);
      if (q !== held && r > lim) { q.x *= lim / r; q.y *= lim / r; }
    }
  }
  function wake() { if (!raf) raf = requestAnimationFrame(step); }

  /* Pulling: the piece follows the pointer, but less and less the further it goes. */
  var start = null, moved = false;
  function onDown(ev) {
    if (!on || ev.button !== 0 || ev.pointerType === "touch") return;
    if (ev.target.closest(config.ignore)) return;
    var p = null;
    for (var i = 0; i < pieces.length; i++) if (pieces[i].el.contains(ev.target)) { p = pieces[i]; break; }
    if (!p) return;
    measure();
    held = p; moved = false;
    start = { x: ev.clientX, y: ev.clientY, ox: p.x, oy: p.y, id: ev.pointerId };
    p.vx = p.vy = 0;
    ev.preventDefault();   // no text selection, no native image drag
  }
  function onMove(ev) {
    if (!held || ev.pointerId !== start.id) return;
    var dx = ev.clientX - start.x + start.ox, dy = ev.clientY - start.y + start.oy, r = Math.sqrt(dx * dx + dy * dy);
    if (!moved && r < 4) return;
    if (!moved) { moved = true; root.classList.add("is-dragging-piece"); held.el.classList.add("is-held"); }
    var R = config.reach, f = r > 0 ? R * (1 - Math.exp(-r / R)) / r : 0;
    var nx = dx * f, ny = dy * f;
    held.vx = nx - held.x; held.vy = ny - held.y;   // so a flick carries on a little when let go
    held.x = nx; held.y = ny;
    wake();
  }
  function onUp(ev) {
    if (!held || (ev.pointerId !== undefined && ev.pointerId !== start.id)) return;
    held.el.classList.remove("is-held"); root.classList.remove("is-dragging-piece");
    held = null; wake();
    if (moved) {
      // a drag is not a click: swallow the click that follows on a link
      window.addEventListener("click", function swallow(e) { e.preventDefault(); e.stopPropagation(); window.removeEventListener("click", swallow, true); }, true);
      setTimeout(function () { moved = false; }, 0);
    }
  }

  function toggle(v) {
    on = v === undefined ? !on : !!v;
    root.classList.toggle("is-draggy", on);
    if (on) { pieces = collect(); pieces.forEach(function (p) { p.el.classList.add("draggy-piece"); }); measure(); }
    else {
      held = null; cancelAnimationFrame(raf); raf = 0;
      pieces.forEach(function (p) { p.el.classList.remove("draggy-piece", "is-held"); p.el.style.translate = ""; });
      pieces = [];
    }
  }

  function init() {
    if (!config.on || (config.page && !document.querySelector(config.page))) return;
    toggle(true);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", function () { onUp({}); });
    document.addEventListener("dragstart", function (ev) { if (on && ev.target.closest && ev.target.closest(".draggy-piece")) ev.preventDefault(); });
    var rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (on) measure(); }, 150); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.draggy = { toggle: toggle, config: config, pieces: function () { return pieces; } };
})();
