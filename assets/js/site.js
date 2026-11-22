/* Site behaviour: the two preview worlds, the lattice knot lab, the ambient
   self-avoiding walk, the pi estimator, and the CV tools. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  /* All scripted scrolling goes through assets/js/autoscroll.js (settings: [autoscroll] in params.toml). */
  var glide = function (el, use) {
    if (window.autoscroll) return window.autoscroll.to(el, use);
    el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    return new Promise(function (r) { setTimeout(function () { r(true); }, reduceMotion ? 0 : 700); });
  };

  var odList = (root.dataset.od || "").split(" ");
  var OD = { knot: odList.indexOf("knot") >= 0, pages: odList.indexOf("pages") >= 0, vitae: odList.indexOf("vitae") >= 0 };
  var rgb = function (str) { return (String(str).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); };
  var mix = function (a, b, t) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")";
  };

  function cssColor(name, alpha) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return "rgba(" + v + "," + (alpha == null ? 1 : alpha) + ")";
  }
  function isDark() { return root.classList.contains("dark"); }
  function palette() {
    var dark = isDark();
    return {
      paper: cssColor(dark ? "--color-neutral-800" : "--color-neutral"),
      ink: getComputedStyle(root).getPropertyValue(dark ? "--color-neutral-100" : "--color-neutral-800").trim(),
      accent: getComputedStyle(root).getPropertyValue(dark ? "--color-secondary-300" : "--color-secondary-500").trim()
    };
  }

  /* ------------------------------------------------------------------ */
  /* Lattice knot lab                                                    */
  /* ------------------------------------------------------------------ */
  /* min is the least number of edges the knot needs on the cubic lattice. proven: true where
     that is a theorem (3_1 Diao; 4_1 and 5_1 Scharein et al.); otherwise it is the best known
     value from simulation and the readout says so. To add a knot, give a closed curve f(t),
     t in [0, 2pi], and check it tightens to the value you expect before trusting the trace. */
  var torus = function (p, q) {
    return function (t) { var r = 2 + Math.cos(q * t); return [r * Math.cos(p * t), r * Math.sin(p * t), Math.sin(q * t)]; };
  };
  var lissajous = function (fx, fy, fz, px, py) {
    return function (t) { return [3 * Math.cos(fx * t + px), 3 * Math.cos(fy * t + py), 1.6 * Math.cos(fz * t)]; };
  };
  var KNOTS = [
    { sym: "3₁", name: "trefoil", min: 24, proven: true, scale: 3, f: torus(2, 3) },
    { sym: "4₁", name: "figure-eight", min: 30, proven: true, scale: 4,
      f: function (t) { var r = 2 + Math.cos(2 * t); return [r * Math.cos(3 * t), r * Math.sin(3 * t), Math.sin(4 * t)]; } },
    { sym: "5₁", name: "cinquefoil", min: 34, proven: true, scale: 3.5, f: torus(2, 5) },
    { sym: "5₂", name: "three-twist", min: 36, scale: 2, f: lissajous(3, 2, 7, 0.7, 0.2) },
    { sym: "6₁", name: "stevedore", min: 40, scale: 2, f: lissajous(3, 2, 5, 1.5, 0.2) },
    { sym: "7₁", name: "septafoil", min: 44, scale: 3.5, f: torus(2, 7) },
    { sym: "8₁₉", name: "torus knot T(3,4)", min: 42, scale: 4, f: torus(3, 4) },
    { sym: "9₁", name: "nonafoil", min: 54, scale: 4, f: torus(2, 9) },
    { sym: "0₁", name: "unknot, in disguise", min: 4, proven: true, scale: 3,
      f: function (t) { var r = 3 + Math.cos(5 * t); return [r * Math.cos(t), r * Math.sin(t), 1.4 * Math.sin(5 * t)]; } }
  ];

  var key = function (v) { return v[0] + "," + v[1] + "," + v[2]; };

  /* Trace a smooth closed curve onto the cubic lattice as a self-avoiding polygon. */
  function traceKnot(knot) {
    for (var scale = knot.scale; scale < knot.scale + 4; scale += 0.5) {
      var verts = [], M = 4000, cur = null, i, k;
      for (i = 0; i <= M; i++) {
        var p = knot.f((i % M) / M * 2 * Math.PI);
        var q = [Math.round(p[0] * scale), Math.round(p[1] * scale), Math.round(p[2] * scale)];
        if (!cur) { cur = q; verts.push(q); continue; }
        for (k = 0; k < 3; k++) {
          while (cur[k] !== q[k]) {
            cur = cur.slice(); cur[k] += q[k] > cur[k] ? 1 : -1; verts.push(cur);
          }
        }
      }
      verts.pop(); // the walk returns to its first vertex
      // remove spikes (a, b, a)
      var changed = true;
      while (changed && verts.length > 4) {
        changed = false;
        for (i = 0; i < verts.length; i++) {
          var a = verts[i], c = verts[(i + 2) % verts.length];
          if (a[0] === c[0] && a[1] === c[1] && a[2] === c[2]) {
            var j = (i + 1) % verts.length, j2 = (i + 2) % verts.length;
            verts = verts.filter(function (_, n) { return n !== j && n !== j2; });
            changed = true; break;
          }
        }
      }
      var seen = new Set(), ok = true;
      for (i = 0; i < verts.length; i++) { var s = key(verts[i]); if (seen.has(s)) { ok = false; break; } seen.add(s); }
      if (ok) return verts;
    }
    return null;
  }

  var DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  var same = function (a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; };

  /* One BFACF proposal on polygon state s = {v: vertices, occ: Set}. Returns the
     change in length (-2, 0, +2) if a move was made, or null. pUp is the chance
     of accepting a lengthening move. BFACF moves preserve knot type. */
  function bfacf(s, pUp, hot, now, fi, fd) {
    var v = s.v, n = v.length, i = fi == null ? (Math.random() * n) | 0 : ((fi % n) + n) % n;
    var a = v[i], b = v[(i + 1) % n], p = v[(i - 1 + n) % n], q = v[(i + 2) % n];
    var d = fd || DIRS[(Math.random() * 6) | 0];
    if ((b[0] - a[0]) * d[0] + (b[1] - a[1]) * d[1] + (b[2] - a[2]) * d[2] !== 0) return null;
    var a2 = [a[0] + d[0], a[1] + d[1], a[2] + d[2]], b2 = [b[0] + d[0], b[1] + d[1], b[2] + d[2]];
    var pa = same(p, a2), qb = same(q, b2);
    // display positions (set by the rope renderer) travel with the vertex they replace
    if (a.d) a2.d = a.d.slice();
    if (b.d) b2.d = b.d.slice();
    if (pa && qb) {
      if (n <= 4) return null;
      s.occ.delete(key(a)); s.occ.delete(key(b));
      var i1 = (i + 1) % n;
      if (i1 > i) v.splice(i, 2); else { v.splice(i, 1); v.splice(0, 1); }
      hot.set(key(a2), now); hot.set(key(b2), now);
      return -2;
    }
    if (pa) {
      if (s.occ.has(key(b2))) return null;
      s.occ.delete(key(a)); s.occ.add(key(b2)); if (a.d) b2.d = a.d; v[i] = b2; hot.set(key(b2), now);
      return 0;
    }
    if (qb) {
      if (s.occ.has(key(a2))) return null;
      s.occ.delete(key(b)); s.occ.add(key(a2)); if (b.d) a2.d = b.d; v[(i + 1) % n] = a2; hot.set(key(a2), now);
      return 0;
    }
    if (Math.random() > pUp) return null;
    if (s.occ.has(key(a2)) || s.occ.has(key(b2))) return null;
    v.splice(i + 1, 0, a2, b2); s.occ.add(key(a2)); s.occ.add(key(b2));
    hot.set(key(a2), now); hot.set(key(b2), now);
    return 2;
  }

  function initKnotLab() {
    var lab = $("#knot-lab"), canvas = $("#knot-canvas");
    if (!lab || !canvas) return;
    var ctx = canvas.getContext("2d");
    var el = { sym: $("#knot-symbol"), title: $("#knot-title"), len: $("#knot-len"), best: $("#knot-best"), min: $("#knot-min") };
    var which = 0, state = null, startLen = 140, best = Infinity, sinceBest = 0, heat = 0, paused = false;
    var hot = new Map(), frame = 0, running = false, visible = true, raf = 0;
    var yaw = 0.6, pitch = 0.5, vyaw = 0, vpitch = 0, dragging = false, lastX = 0, lastY = 0;
    var cam = { cx: 0, cy: 0, cz: 0, r: 12 }, W = 0, H = 0, dpr = 1, pal = palette();
    // overdrive: the knot as a hollow rope that can be taken hold of and pulled
    var rope = OD.knot, grab = null, hover = -1, px = 0, py = 0, pullOff = null, Pc = null, lwNow = 8;
    var view = { r: [1, 0, 0], u: [0, 0, 1], unit: 1 }, wave = -1e9, tight = false;
    if (rope) {
      el.min.innerHTML = '<span class="knot-min-wrap"><span></span><svg class="knot-ring" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">' +
        '<path pathLength="1" d="M20 13C40 2 80 3 93 24C101 45 70 58 42 56C15 54 1 40 8 23C13 11 32 4 54 6"/></svg></span>';
      el.min = el.min.querySelector("span span");
    }

    function load(k) {
      which = k;
      var knot = KNOTS[k], verts = traceKnot(knot);
      state = { v: verts, occ: new Set(verts.map(key)) };
      best = verts.length; startLen = verts.length; sinceBest = 0; heat = 0; hot.clear();
      grab = null; hover = -1; pullOff = null; tight = false; wave = -1e9;
      el.sym.textContent = knot.sym; el.title.textContent = knot.name; el.min.textContent = knot.min;
      var minLabel = $("#knot-min-label"); if (minLabel) minLabel.textContent = knot.proven ? "proven minimum" : "best known";
      snapCamera();
      if (reduceMotion) { for (var i = 0; i < 400000 && state.v.length > knot.min; i++) step(1); snapCamera(); }
      readout();
    }
    function bounds() {
      var v = state.v, cx = 0, cy = 0, cz = 0, r = 0, i;
      for (i = 0; i < v.length; i++) { cx += v[i][0]; cy += v[i][1]; cz += v[i][2]; }
      cx /= v.length; cy /= v.length; cz /= v.length;
      for (i = 0; i < v.length; i++) {
        var dx = v[i][0] - cx, dy = v[i][1] - cy, dz = v[i][2] - cz;
        r = Math.max(r, Math.sqrt(dx * dx + dy * dy + dz * dz));
      }
      return { cx: cx, cy: cy, cz: cz, r: Math.max(r, 2.2) };
    }
    function snapCamera() { cam = bounds(); }
    function step(count) {
      var knot = KNOTS[which];
      for (var c = 0; c < count; c++) {
        // Annealing: mostly shorten, with a little slack so the polygon can wriggle out of traps.
        var pUp = heat > 0 ? 0.85 : (sinceBest > 60000 ? 0.02 : 0.004);
        var d = bfacf(state, pUp, hot, frame);
        if (heat > 0) heat--;
        sinceBest++;
        if (state.v.length < best) { best = state.v.length; sinceBest = 0; }
        if (sinceBest > 90000) sinceBest = 0;
        if (d === null) continue;
      }
      if (state.v.length <= knot.min && heat === 0) sinceBest = 0;
    }
    function readout() {
      var knot = KNOTS[which];
      el.len.textContent = state.v.length;
      el.best.textContent = best;
      lab.classList.toggle("is-minimal", best <= knot.min);
      if (rope) {
        var now = state.v.length <= knot.min;
        if (now && !tight) wave = frame;          // one lap of ink round the rope when it pulls tight
        tight = now; lab.classList.toggle("is-tight", tight);
      }
    }
    function projector() {
      var cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      var unit = Math.min(W, H) * 0.31 / cam.r, dist = cam.r * 4.2;
      view.r = [cyw, -syw, 0]; view.u = [syw * sp, cyw * sp, cp]; view.unit = unit;
      return function (x, y, z) {
        x -= cam.cx; y -= cam.cy; z -= cam.cz;
        var x1 = x * cyw - y * syw, y1 = x * syw + y * cyw;       // spin about the vertical axis
        var y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;          // tilt
        var k = dist / (dist + y2);
        return [W / 2 + x1 * unit * k, H * 0.45 - z2 * unit * k, y2, k];
      };
    }
    var ring = function (a, b, n) { var d = Math.abs(a - b); return Math.min(d, n - d); };
    /* Which vertex of the rope is under the pointer, if any. Nearer strands win a close call. */
    function hit(x, y) {
      if (!Pc) return -1;
      var reach = Math.max(16, lwNow * 1.3), bestI = -1, bestD = reach, i;
      for (i = 0; i < Pc.length; i++) {
        var d = Math.sqrt((Pc[i][0] - x) * (Pc[i][0] - x) + (Pc[i][1] - y) * (Pc[i][1] - y));
        if (d >= reach) continue;
        if (bestI < 0 || d < bestD - 4 || (d < bestD + 4 && Pc[i][2] < Pc[bestI][2])) { bestD = d; bestI = i; }
      }
      return bestI;
    }
    /* Pull: BFACF moves forced on the edges at the held vertex, in the lattice direction
       the pointer is asking for. They are still BFACF moves, so the knot type is safe,
       and the rope cannot pass through itself. */
    function pull() {
      var v = state.v, project = projector();
      // up to three moves a frame, so the rope keeps up with a quick hand
      for (var rep = 0; rep < 3; rep++) {
        var n = v.length;
        if (grab >= n) grab = n - 1;
        var w = v[grab], q = project(w[0], w[1], w[2]), u = view.unit * q[3];
        var dx = (px - q[0]) / u, dy = -(py - q[1]) / u, len = Math.sqrt(dx * dx + dy * dy);
        var wv = [dx * view.r[0] + dy * view.u[0], dx * view.r[1] + dy * view.u[1], dx * view.r[2] + dy * view.u[2]];
        if (rep === 0) {
          var s = len > 0 ? Math.min(0.42, len * 0.5) / len : 0;
          pullOff = [wv[0] * s, wv[1] * s, wv[2] * s];
        }
        if (len < 0.6) return;
        // every lattice direction that points at all towards the pointer, best first, on the two
        // edges at the held vertex and then the two beyond them: something nearly always gives
        var order = [0, 1, 2].sort(function (a, b) { return Math.abs(wv[b]) - Math.abs(wv[a]); });
        var moved = false, room = n < Math.max(startLen, 140) + 90 ? 1 : 0;
        var edges = Math.random() < 0.5 ? [grab - 1, grab, grab - 2, grab + 1] : [grab, grab - 1, grab + 1, grab - 2];
        for (var a = 0; a < 3 && !moved; a++) {
          var ax = order[a];
          if (Math.abs(wv[ax]) < 0.2 * len) break;
          var d = [0, 0, 0]; d[ax] = wv[ax] > 0 ? 1 : -1;
          for (var t = 0; t < 4 && !moved; t++) moved = bfacf(state, room, hot, frame, edges[t], d) !== null;
        }
        if (!moved) return;
        // the held vertex may have been replaced or renumbered: take the nearest one close by on the rope
        n = v.length;
        var bestI = grab % n, bestD = Infinity;
        for (var o = -4; o <= 4; o++) {
          var j = (((grab + o) % n) + n) % n, pj = project(v[j][0], v[j][1], v[j][2]);
          var dd = (pj[0] - px) * (pj[0] - px) + (pj[1] - py) * (pj[1] - py);
          if (dd < bestD) { bestD = dd; bestI = j; }
        }
        grab = bestI;
      }
    }
    function drawRope(project, unit) {
      var v = state.v, n = v.length, i, k, e = reduceMotion ? 1 : 0.75;   // moves land almost at once: snappy, with the corner taken off
      var P = new Array(n), ink = rgb(pal.ink), paper = rgb(pal.paper), accent = rgb(pal.accent);
      for (i = 0; i < n; i++) {
        var w = v[i];
        if (!w.d) w.d = [w[0], w[1], w[2]];
        for (k = 0; k < 3; k++) {
          var target = w[k] + (grab === i && pullOff ? pullOff[k] : 0);
          w.d[k] += (target - w.d[k]) * e;
        }
        P[i] = project(w.d[0], w.d[1], w.d[2]);
      }
      Pc = P;
      var floor = cam.cz - cam.r - 1.5;
      ctx.beginPath();
      for (i = 0; i <= n; i++) {
        var f = v[i % n].d, s = project(f[0], f[1], floor);
        if (i === 0) ctx.moveTo(s[0], s[1]); else ctx.lineTo(s[0], s[1]);
      }
      ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(2, unit * 0.3);
      ctx.strokeStyle = "rgba(" + ink.join(",") + ",0.08)"; ctx.stroke();

      // each piece runs from the middle of the edge before to the middle of the edge after,
      // painted far to near: paper sleeve, ink wall, paper core. Crossings read as over and under.
      var order = new Array(n);
      for (i = 0; i < n; i++) order[i] = { i: i, z: (P[i][2] + P[(i + 1) % n][2]) / 2 };
      order.sort(function (m, o) { return o.z - m.z; });
      var base = Math.max(5.5, unit * 0.4), wt = frame - wave, lap = n * 0.14;
      lwNow = base;
      ctx.lineCap = "butt";
      for (var c = 0; c < n; c++) {
        var at = order[c].i, A = P[at], B = P[(at + 1) % n], A0 = P[(at - 1 + n) % n], B1 = P[(at + 2) % n];
        var lw = base * (A[3] + B[3]) / 2;
        var depth = Math.max(0, Math.min(1, (order[c].z + cam.r) / (2 * cam.r)));
        var ha = hot.get(key(v[at])), hb = hot.get(key(v[(at + 1) % n]));
        var age = frame - Math.max(ha == null ? -1e9 : ha, hb == null ? -1e9 : hb);
        var lit = age < 26 ? 1 - age / 26 : 0;
        if (grab != null) lit = Math.max(lit, 1 - ring(at, grab, n) / 3);
        else if (hover >= 0 && ring(at, hover, n) <= 1) lit = Math.max(lit, 0.6);
        if (wt >= 0 && wt < 100) {
          var behind = (((wt / 100 * (n + lap) - at) % n) + n) % n;
          if (behind < lap) lit = Math.max(lit, 1 - behind / lap);
        }
        ctx.beginPath();
        ctx.moveTo((A0[0] + A[0]) / 2, (A0[1] + A[1]) / 2);
        ctx.lineTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
        ctx.lineTo((B[0] + B1[0]) / 2, (B[1] + B1[1]) / 2);
        ctx.lineWidth = lw + 6; ctx.strokeStyle = pal.paper; ctx.stroke();
        ctx.lineWidth = lw; ctx.strokeStyle = mix(ink, paper, depth * 0.5); ctx.stroke();
        ctx.lineWidth = lw * 0.48; ctx.strokeStyle = lit > 0.02 ? mix(paper, accent, Math.min(1, lit)) : pal.paper; ctx.stroke();
      }
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    function draw() {
      var v = state.v, n = v.length, i;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var b = bounds(), e = reduceMotion ? 1 : 0.06;
      cam.cx += (b.cx - cam.cx) * e; cam.cy += (b.cy - cam.cy) * e; cam.cz += (b.cz - cam.cz) * e; cam.r += (b.r - cam.r) * e;
      var project = projector(), unit = view.unit;
      if (rope) { drawRope(project, unit); return; }
      var P = new Array(n);
      for (i = 0; i < n; i++) P[i] = project(v[i][0], v[i][1], v[i][2]);

      // floor shadow
      var floor = cam.cz - cam.r - 1.5;
      ctx.beginPath();
      for (i = 0; i <= n; i++) {
        var w = v[i % n], s = project(w[0], w[1], floor);
        if (i === 0) ctx.moveTo(s[0], s[1]); else ctx.lineTo(s[0], s[1]);
      }
      ctx.lineJoin = "round"; ctx.lineWidth = Math.max(1.5, unit * 0.16);
      ctx.strokeStyle = "rgba(" + pal.ink + ",0.09)"; ctx.stroke();

      // edges, far to near, each with a paper-coloured sleeve so crossings read as over and under
      var edges = new Array(n);
      for (i = 0; i < n; i++) edges[i] = { i: i, z: (P[i][2] + P[(i + 1) % n][2]) / 2 };
      edges.sort(function (m, o) { return o.z - m.z; });
      var lw = Math.max(3.2, unit * 0.2);
      ctx.lineCap = "round";
      for (var e2 = 0; e2 < n; e2++) {
        var ed = edges[e2], A = P[ed.i], B = P[(ed.i + 1) % n];
        var depth = Math.max(0, Math.min(1, (ed.z + cam.r) / (2 * cam.r)));   // 0 near, 1 far
        var ha = hot.get(key(v[ed.i])), hb = hot.get(key(v[(ed.i + 1) % n]));
        var age = frame - Math.max(ha == null ? -1e9 : ha, hb == null ? -1e9 : hb);
        var glow = age < 26 ? 1 - age / 26 : 0;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
        ctx.lineCap = "butt"; ctx.lineWidth = lw * A[3] + 5; ctx.strokeStyle = pal.paper; ctx.stroke();
        ctx.lineCap = "round"; ctx.lineWidth = lw * A[3];
        ctx.strokeStyle = glow > 0.02
          ? "rgba(" + pal.accent + "," + (0.55 + 0.45 * glow) + ")"
          : "rgba(" + pal.ink + "," + (0.95 - depth * 0.55) + ")";
        ctx.stroke();
      }
      // lattice vertices
      for (i = 0; i < n; i++) {
        var dp = Math.max(0, Math.min(1, (P[i][2] + cam.r) / (2 * cam.r)));
        ctx.beginPath(); ctx.arc(P[i][0], P[i][1], lw * 0.2 * P[i][3], 0, 6.2832);
        ctx.globalAlpha = 0.9 - dp * 0.5; ctx.fillStyle = pal.paper; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    function tick() {
      raf = 0;
      if (!running) return;
      frame++;
      if (!paused && !reduceMotion) {
        // paced so a knot takes ten to twenty seconds to pull tight, whatever its starting length
        var slack = state.v.length - KNOTS[which].min;
        // while the rope is held it does not tighten, so nothing fights the pull
        // once it stalls short of the minimum it searches much harder, so the big knots get there too
        var rate = heat > 0 ? 60 : slack > 30 ? 45 : (slack > 0 && sinceBest > 2500) ? 150 : 40;
        step(grab != null ? 0 : Math.round(rate * Math.min(2, startLen / 140)));
      }
      if (grab != null) pull();
      if (!dragging) {
        yaw += vyaw + (reduceMotion ? 0 : 0.0032); pitch += vpitch;
        vyaw *= 0.94; vpitch *= 0.94;
      }
      pitch = Math.max(-1.2, Math.min(1.2, pitch));
      if (frame % 40 === 0) { hot.forEach(function (t, k) { if (frame - t > 40) hot.delete(k); }); }
      draw();
      if (frame % 6 === 0) readout();
      schedule();
    }
    function schedule() { if (!raf && running) raf = requestAnimationFrame(tick); }
    function setRunning() {
      var should = visible && !document.hidden;
      if (should && !running) { running = true; resize(); pal = palette(); schedule(); }
      else if (!should) running = false;
    }

    function local(ev) { var r = canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
    canvas.addEventListener("pointerdown", function (ev) {
      dragging = true; lastX = ev.clientX; lastY = ev.clientY; canvas.setPointerCapture(ev.pointerId);
      if (rope) {
        var at = local(ev), h = hit(at[0], at[1]);
        if (h >= 0) { grab = h; px = at[0]; py = at[1]; vyaw = vpitch = 0; lab.classList.add("is-pulling"); return; }
      }
      lab.classList.add("is-dragging");
    });
    if (rope) {
      // a finger on the rope pulls it; a finger beside it still scrolls the page
      canvas.addEventListener("touchstart", function (ev) {
        var r = canvas.getBoundingClientRect(), t = ev.touches[0];
        if (t && hit(t.clientX - r.left, t.clientY - r.top) >= 0) ev.preventDefault();
      }, { passive: false });
      canvas.addEventListener("pointerleave", function () { if (hover >= 0) { hover = -1; lab.classList.remove("is-over-rope"); } });
    }
    canvas.addEventListener("pointermove", function (ev) {
      if (rope && grab != null) { var at = local(ev); px = at[0]; py = at[1]; return; }
      if (rope && !dragging) {
        var o = local(ev), h = hit(o[0], o[1]);
        if (h !== hover) { hover = h; lab.classList.toggle("is-over-rope", h >= 0); if (reduceMotion) draw(); }
        return;
      }
      if (!dragging) return;
      vyaw = (ev.clientX - lastX) * 0.008; vpitch = (ev.clientY - lastY) * 0.006;
      yaw += vyaw; pitch += vpitch; lastX = ev.clientX; lastY = ev.clientY;
      if (reduceMotion || paused) { pitch = Math.max(-1.2, Math.min(1.2, pitch)); draw(); }
    });
    ["pointerup", "pointercancel"].forEach(function (t) {
      canvas.addEventListener(t, function () {
        dragging = false; grab = null; pullOff = null;
        lab.classList.remove("is-dragging"); lab.classList.remove("is-pulling");
      });
    });
    canvas.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowLeft") vyaw = -0.05; else if (ev.key === "ArrowRight") vyaw = 0.05;
      else if (ev.key === "ArrowUp") vpitch = -0.04; else if (ev.key === "ArrowDown") vpitch = 0.04;
      else return;
      ev.preventDefault();
    });
    canvas.tabIndex = 0;

    $("#knot-next").addEventListener("click", function () { load((which + 1) % KNOTS.length); draw(); });
    $("#knot-shake").addEventListener("click", function () {
      if (reduceMotion) { load(which); draw(); return; }
      heat = 2600; best = Infinity; sinceBest = 0;
      setTimeout(function () { best = state.v.length; }, 900);
    });
    $("#knot-pause").addEventListener("click", function () {
      paused = !paused; this.setAttribute("aria-pressed", String(paused));
      this.textContent = paused ? "Resume" : "Pause";
    });

    new ResizeObserver(function () { resize(); if (state) draw(); }).observe(canvas);
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRunning(); }).observe(lab);
    document.addEventListener("visibilitychange", setRunning);
    new MutationObserver(function () { pal = palette(); if (state) draw(); }).observe(root, { attributes: true, attributeFilter: ["class"] });

    load(0);
    resize();
    setRunning();
    draw();
    window.__knot = { state: function () { return state; }, best: function () { return best; }, step: step, load: load, tick: function () { running = true; resize(); tick(); } };
  }

  /* ------------------------------------------------------------------ */
  /* Pi by Monte Carlo, as the page backdrop. The viewport is the square;   */
  /* the ellipse inscribed in it is the target. Every pointer move throws  */
  /* one dart. The readout is a switch: off, it says pi = 3 and the board  */
  /* is bare; on again, a volley of darts brings the estimate back.        */
  /* ------------------------------------------------------------------ */
  function initPi() {
    var canvas = $("#pi-canvas"), box = $("#pi-box");
    if (!canvas || $("#knot-lab")) return;            // the home page has the knot instead
    canvas.hidden = false; box.hidden = false;
    var out = $("#pi-value"), rel = $("#pi-rel"), sub = $("#pi-sub"), button = $("#pi-readout");
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = 1;
    var inside = 0, total = 0, last = 0, raf = 0, pal = palette(), on = true;
    var darts = [];    // settled: {x, y in 0..1, hit}
    var live = [];     // still landing: {x, y, hit, t0}
    var MAX = 2600, LAND = 900;
    try {
      var saved = JSON.parse(localStorage.getItem("pi") || "null"); if (saved) { inside = saved[0]; total = saved[1]; }
      on = localStorage.getItem("pi-off") !== "1";
      if (OD.pages) JSON.parse(sessionStorage.getItem("pi-darts") || "[]").forEach(function (d) { darts.push({ x: d[0], y: d[1], hit: !!d[2] }); });
    } catch (e) {}

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      paint(performance.now());
    }
    function dot(d, r, a) {
      ctx.beginPath(); ctx.arc(d.x * W, d.y * H, r, 0, 6.2832);
      ctx.fillStyle = "rgba(" + (d.hit ? pal.accent : pal.ink) + "," + a + ")"; ctx.fill();
    }
    function paint(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!on || W < 4 || H < 4) return;                // switched off, or a hidden window
      // the target: an ellipse touching all four edges of the page
      ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W / 2 - 1, H / 2 - 1, 0, 0, 6.2832);
      ctx.lineWidth = 1.25; ctx.setLineDash([2, 7]);
      ctx.strokeStyle = "rgba(" + pal.accent + ",0.38)"; ctx.stroke(); ctx.setLineDash([]);
      var i;
      for (i = 0; i < darts.length; i++) dot(darts[i], 1.7, darts[i].hit ? 0.36 : 0.26);
      for (i = live.length - 1; i >= 0; i--) {
        var d = live[i], t = Math.max(0, Math.min(1, (now - d.t0) / LAND)), e = 1 - Math.pow(1 - t, 4);
        // a ring that swells and thins as the dart lands, then leaves its dot behind
        ctx.beginPath(); ctx.arc(d.x * W, d.y * H, 3 + 26 * e, 0, 6.2832);
        ctx.lineWidth = 1.5 * (1 - e) + 0.3;
        ctx.strokeStyle = "rgba(" + (d.hit ? pal.accent : pal.ink) + "," + 0.42 * (1 - e) + ")"; ctx.stroke();
        dot(d, 1.7 + 2.2 * (1 - e), 0.36 + 0.4 * (1 - e));
        if (t >= 1) { live.splice(i, 1); darts.push(d); if (darts.length > MAX) darts.shift(); }
      }
    }
    function frame(now) { raf = 0; paint(now); if (live.length) raf = requestAnimationFrame(frame); }
    function show() {
      if (!on) { rel.textContent = "="; out.textContent = "3"; return; }
      rel.textContent = "≈"; out.textContent = total ? (4 * inside / total).toFixed(4) : "?";
      sub.textContent = total.toLocaleString("en") + (total === 1 ? " dart" : " darts");
    }
    function throwDart() {
      if (!on) return;
      var d = { x: Math.random(), y: Math.random(), t0: performance.now() };
      d.hit = (d.x - 0.5) * (d.x - 0.5) + (d.y - 0.5) * (d.y - 0.5) <= 0.25;
      total++; if (d.hit) inside++;
      if (reduceMotion) { darts.push(d); if (darts.length > MAX) darts.shift(); paint(d.t0); }
      else { live.push(d); if (!raf) raf = requestAnimationFrame(frame); }
      show();
    }
    function save() {
      try {
        localStorage.setItem("pi", JSON.stringify([inside, total])); localStorage.setItem("pi-off", on ? "0" : "1");
        if (OD.pages) sessionStorage.setItem("pi-darts", JSON.stringify(darts.concat(live).slice(-700).map(function (d) {
          return [Math.round(d.x * 1e4) / 1e4, Math.round(d.y * 1e4) / 1e4, d.hit ? 1 : 0];
        })));
      } catch (e) {}
    }
    /* Switching is instant, with no motion: off clears the board and reads "π = 3";
       on again starts a clean tally, and a volley of 110 darts trickles in over about a second. */
    function setOn(v, byHand) {
      on = v;
      button.setAttribute("aria-pressed", String(on));
      box.classList.toggle("is-off", !on); box.classList.toggle("is-shut", !on);
      if (!on) { darts = []; live = []; paint(performance.now()); show(); save(); return; }
      if (!byHand) { show(); paint(performance.now()); return; }   // page load: keep the saved tally
      inside = 0; total = 0;                           // switched back on by hand: a clean slate, not the old tally
      show(); save();
      if (reduceMotion) { for (var k = 0; k < 40; k++) throwDart(); return; }
      // a volley of darts, quick at first and thinning out
      var n = 110;
      for (var i = 0; i < n; i++) setTimeout(throwDart, 900 * Math.pow(i / n, 1.7));
    }
    button.addEventListener("click", function () { setOn(!on, true); });
    size(); setOn(on, false);
    window.addEventListener("pointermove", function (ev) {
      if (ev.timeStamp - last < 70) return;
      last = ev.timeStamp; throwDart();
    }, { passive: true });
    window.addEventListener("scroll", function () {
      var now = performance.now(); if (now - last < 160) return; last = now; throwDart();
    }, { passive: true });
    // a slow drizzle so the page is never quite still, even with no pointer
    if (!reduceMotion) setInterval(function () { if (!document.hidden) throwDart(); }, 2400);
    var rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });
    window.addEventListener("pagehide", save);
    new MutationObserver(function () { pal = palette(); paint(performance.now()); }).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  /* ------------------------------------------------------------------ */
  /* Document reader: page counter and previous / next                    */
  /* ------------------------------------------------------------------ */
  function initReader() {
    $$("[data-reader]").forEach(function (reader) {
      var pages = $$("[data-reader-page]", reader), now = $("[data-reader-now]", reader), current = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { current = pages.indexOf(en.target); now.textContent = current + 1; }
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      pages.forEach(function (pg) { io.observe(pg); });
      function go(i) {
        i = Math.max(0, Math.min(pages.length - 1, i));
        glide(pages[i], "reader");
      }
      $("[data-reader-prev]", reader).addEventListener("click", function () { go(current - 1); });
      $("[data-reader-next]", reader).addEventListener("click", function () { go(current + 1); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* CV: section rail, filter, random line, grade map                    */
  /* ------------------------------------------------------------------ */
  function initCV() {
    var page = $(".cv-page");
    if (!page) return;
    var list = $("#cv-rail-list"), heads = $$(".cv-content h2");
    var links = heads.map(function (h) {
      var li = document.createElement("li"), a = document.createElement("a");
      // Blowfish keeps the heading id on an empty <div class="anchor"> inside the heading
      var anchor = $(".anchor", h); a.href = "#" + (h.id || (anchor && anchor.id) || "");
      a.textContent = h.textContent.replace(/#\s*$/, "").trim();
      li.appendChild(a); list.appendChild(li);
      return a;
    });
    // the current section is the last heading that has reached the bars at the top
    var rail = $(".cv-rail"), shown = -2;
    function markRail() {
      var line = (window.autoscroll ? window.autoscroll.cover() : 120) + 40, idx = -1;
      // at the foot of the page the last sections can never reach the top: take what is in view
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) line = window.innerHeight * 0.6;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].offsetParent && heads[i].getBoundingClientRect().top <= line) idx = i;
      }
      if (idx === shown) return;
      shown = idx;
      links.forEach(function (a, i) { if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      if (idx >= 0 && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: links[idx].offsetLeft - 24, behavior: reduceMotion ? "auto" : "smooth" });
    }
    window.addEventListener("scroll", markRail, { passive: true });   // ten headings: cheap enough to run on every scroll
    markRail();

    var lastPick = null;
    $("#cv-random").addEventListener("click", function () {
      var pool = $$(".cv-entry").filter(function (e) { return e.offsetParent; });
      if (!pool.length) return;
      var pick;
      do { pick = pool[(Math.random() * pool.length) | 0]; } while (pool.length > 1 && pick === lastPick);
      lastPick = pick;
      $$(".cv-entry.is-drawn").forEach(function (e) { e.classList.remove("is-drawn"); });
      // the mark goes on once the page has stopped moving (or once the reader took over)
      glide(pick, "draw").then(function () {
        if (lastPick !== pick) return;
        if (OD.vitae) { pencil($(".cv-title", pick), "draw"); return; }
        void pick.offsetWidth; pick.classList.add("is-drawn");
      });
    });

    var readout = $(".grademap-readout");
    if (readout) {
      var code = $(".gm-code", readout), name = $(".gm-name", readout), grade = $(".gm-grade", readout);
      $$("button.gm-cell").forEach(function (cell) {
        var showCell = function () {
          code.textContent = cell.dataset.code; name.textContent = cell.dataset.name;
          grade.textContent = cell.dataset.grade === "AU" ? "audit" : cell.dataset.grade === "PP" ? "pass" : cell.dataset.grade;
          $$("button.gm-cell.is-on").forEach(function (c) { c.classList.remove("is-on"); });
          cell.classList.add("is-on");
        };
        cell.addEventListener("pointerenter", showCell);
        cell.addEventListener("focus", showCell);
        cell.addEventListener("click", showCell);
        if (OD.vitae) cell.addEventListener("click", function () { flyToCourse(cell); });
      });
    }

    if (!OD.vitae) return;
    /* ---- overdrive: the living CV ---- */

    /* A pencil underline that draws itself under the last line of host's text. */
    function pencil(host, group) {
      $$('.od-pencil[data-group="' + group + '"]').forEach(function (o) { o.remove(); });
      var range = document.createRange(); range.selectNodeContents(host);
      var rects = range.getClientRects(); if (!rects.length) return;
      var r = rects[rects.length - 1], hr = host.getBoundingClientRect(), w = Math.round(r.width + 10), NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "od-pencil"); svg.setAttribute("data-group", group); svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("viewBox", "0 0 " + w + " 12"); svg.setAttribute("width", w); svg.setAttribute("height", 12);
      svg.style.left = (r.left - hr.left - 4) + "px"; svg.style.top = (r.bottom - hr.top - 1) + "px";
      var j = function (a) { return (a + (Math.random() - 0.5) * 2.2).toFixed(1); };
      var d1 = "M2 " + j(5), steps = Math.max(3, Math.round(w / 70)), i;
      for (i = 1; i <= steps; i++) d1 += " Q" + (w * (i - 0.5) / steps).toFixed(1) + " " + j(i % 2 ? 2.5 : 6.5) + " " + (i === steps ? w - 2 : (w * i / steps).toFixed(1)) + " " + j(4.5);
      var d2 = "M" + (w * 0.94).toFixed(1) + " " + j(8.5) + " Q" + (w * 0.66).toFixed(1) + " " + j(10.5) + " " + (w * 0.4).toFixed(1) + " " + j(8.5);
      [d1, d2].forEach(function (d) {
        var path = document.createElementNS(NS, "path"); path.setAttribute("d", d); path.setAttribute("pathLength", "1"); svg.appendChild(path);
      });
      host.appendChild(svg);
      void svg.getBoundingClientRect(); svg.classList.add("is-on");
    }

    /* A grade square, clicked, flies down to its row in the course list and stamps the grade. */
    function flyToCourse(cell) {
      var rows = $$(".course").filter(function (r) { return $(".course-code", r).textContent.trim() === cell.dataset.code; });
      var row = rows.filter(function (r) { return r.closest(".tab__panel"); })[0];
      if (row) {
        var panel = row.closest(".tab__panel"), tab = $$(".tab__button", panel.closest(".tab__container"))[+panel.dataset.tabIndex];
        if (tab && !panel.classList.contains("tab--active")) tab.click();
      } else row = rows.filter(function (r) { return r.offsetParent; })[0];
      if (!row || !row.offsetParent) return;
      var target = $(".course-grade", row);
      var land = function () {
        $$(".course.is-marked").forEach(function (o) { o.classList.remove("is-marked"); });
        void row.offsetWidth; row.classList.add("is-marked");
        pencil($(".course-title", row), "course");
      };
      var scrolled = glide(row, "course");
      if (reduceMotion) { scrolled.then(land); return; }
      $$(".od-ghost").forEach(function (o) { o.remove(); });
      var ghost = document.createElement("i");
      ghost.className = "gm-cell od-ghost"; ghost.dataset.grade = cell.dataset.grade;
      document.body.appendChild(ghost);
      var t0 = performance.now(), D = 720;
      (function frame(now) {
        var t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
        var a = cell.getBoundingClientRect(), b = target.getBoundingClientRect();
        var w = a.width + (b.width - a.width) * e, h = a.height + (b.height - a.height) * e;
        var x = a.left + (b.left - a.left) * e, y = a.top + (b.top - a.top) * e - Math.sin(Math.PI * e) * 34;
        ghost.style.width = w + "px"; ghost.style.height = h + "px";
        ghost.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        if (t < 1) requestAnimationFrame(frame); else { ghost.remove(); scrolled.then(land); }
      })(t0);
    }

    /* The grade map is one stop for the Tab key; the arrow keys walk the squares. */
    var cells = $$("button.gm-cell"), rowsOf = $$(".grademap-cells").map(function (r) { return $$("button.gm-cell", r); });
    cells.forEach(function (c, i) {
      c.tabIndex = i ? -1 : 0;
      c.addEventListener("focus", function () { cells.forEach(function (o) { o.tabIndex = o === c ? 0 : -1; }); });
      c.addEventListener("keydown", function (ev) {
        var to = null, r, col;
        if (ev.key === "ArrowRight") to = cells[i + 1];
        else if (ev.key === "ArrowLeft") to = cells[i - 1];
        else if (ev.key === "Home") to = cells[0];
        else if (ev.key === "End") to = cells[cells.length - 1];
        else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
          for (r = 0; r < rowsOf.length; r++) if ((col = rowsOf[r].indexOf(c)) >= 0) break;
          var next = rowsOf[r + (ev.key === "ArrowDown" ? 1 : -1)];
          if (next) to = next[Math.min(col, next.length - 1)];
        } else return;
        ev.preventDefault();
        if (to) to.focus();
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Small things                                                        */
  /* ------------------------------------------------------------------ */
  function initUnfold() {
    $$(".unfold-term").forEach(function (b) {
      b.addEventListener("click", function () {
        var more = b.nextElementSibling, open = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!open)); more.hidden = open;
      });
    });
  }

  /* Headings get their ink underline when they scroll into view (notebook world). */
  function initInk() {
    var targets = $$(".prose h2, .now-title, .cv-content h2");
    if (!("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("inked"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("inked"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* Knot figures (svg[data-knot]): the classic trefoil, drawn as a hollow tube in short pieces
     painted far to near so every crossing reads as over or under. A click sends one crossing's
     strands through each other like a ghost, swapping over and under, which leaves no knot at
     all; a second click passes them back. Hovering runs a pulse of colour once round. */
  /* Where two pieces of the flattened curve cross: [i, j, u, v] for segments i and j. */
  function crossings(xy) {
    var N = xy.length, out = [], i, j;
    for (i = 0; i < N; i++) for (j = i + 2; j < N; j++) {
      if (i === 0 && j === N - 1) continue;
      var A = xy[i], B = xy[(i + 1) % N], P = xy[j], Q = xy[(j + 1) % N];
      var den = (B[0] - A[0]) * (Q[1] - P[1]) - (B[1] - A[1]) * (Q[0] - P[0]);
      if (Math.abs(den) < 1e-12) continue;
      var u = ((P[0] - A[0]) * (Q[1] - P[1]) - (P[1] - A[1]) * (Q[0] - P[0])) / den;
      var v = ((P[0] - A[0]) * (B[1] - A[1]) - (P[1] - A[1]) * (B[0] - A[0])) / den;
      if (u >= 0 && u < 1 && v >= 0 && v < 1) out.push([i, j, u, v]);
    }
    return out;
  }
  var trefoil = function (N) {
    var P = [];
    for (var i = 0; i < N; i++) { var t = i / N * 2 * Math.PI; P.push([Math.sin(t) + 2 * Math.sin(2 * t), -(Math.cos(t) - 2 * Math.cos(2 * t))]); }
    return P;
  };
  /* The shadow as a 3-D curve: a small bump up where a strand passes over, down where under.
     Over and under alternate along the knot. Crossing `flip` is part way through swapping:
     at s = 0 it is as drawn, at s = 1 over and under have changed places. */
  function knotDiagram(shape, N, flip, s) {
    var flat = shape(N), passes = [];
    crossings(flat).forEach(function (x, c) { passes.push({ at: x[0] + x[2], c: c }, { at: x[1] + x[3], c: c }); });
    passes.sort(function (p, q) { return p.at - q.at; });
    passes.forEach(function (p, k) { p.h = (k % 2 === 0 ? 1 : -1) * (p.c === flip ? 1 - 2 * s : 1); });
    var W = 5;
    return {
      passes: passes,
      pts: flat.map(function (p, i) {
        var z = 0;
        passes.forEach(function (q) { var dd = Math.abs(i - q.at); dd = Math.min(dd, N - dd); if (dd < 3 * W) z += q.h * Math.exp(-(dd / W) * (dd / W)); });
        return [p[0], p[1], z];
      })
    };
  }

  /* phase: 0..1, how far the under-strand at crossing `flip` has risen through the strand above
     it. It is drawn a second time on top, fading in from nothing to solid, so it shows through
     the over-strand like a ghost before it settles on top. */
  function tubeKnot(svg, shape, flip, s, phase) {
    var N = 360, C = 6, i, c, NS = "http://www.w3.org/2000/svg", dg = knotDiagram(shape, N, flip, s), pts = dg.pts;
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var sc = 160 / Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var xy = pts.map(function (p) { return [100 + (p[0] - cx) * sc, 100 + (p[1] - cy) * sc, p[2]]; });
    // thinner tube where strands run close, so neighbours never merge
    var gapMin = Infinity, skip = Math.floor(N / 12), near = {};
    crossings(xy).forEach(function (x) { for (var k = -8; k <= 9; k++) { near[(x[0] + k + N) % N] = 1; near[(x[1] + k + N) % N] = 1; } });
    for (i = 0; i < N; i += 2) { if (near[i]) continue; for (var j = i + skip; j < N; j += 2) { if (near[j] || N - (j - i) < skip) continue; gapMin = Math.min(gapMin, Math.hypot(xy[i][0] - xy[j][0], xy[i][1] - xy[j][1])); } }
    svg.style.setProperty("--kt", Math.max(0.5, Math.min(1, gapMin / 26)).toFixed(3));
    // the pieces that rise: the under-strand, a little either side of the crossing
    var haunted = {};
    dg.passes.forEach(function (q) {
      if (q.c !== flip || q.h >= 0) return;
      for (var k = -14; k <= 14; k++) haunted[Math.floor((((Math.round(q.at) + k) % N) + N) % N / C)] = 1;
    });
    var chunks = [];
    for (c = 0; c < N / C; c++) {
      var z = 0, d = "";
      for (i = -1; i <= C + 1; i++) {
        var p = xy[(c * C + i + N) % N];
        d += (i === -1 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1);
        z += p[2];
      }
      chunks.push({ at: c, z: z, d: d });
    }
    var unders = crossings(xy).map(function (x) {
      var A = xy[x[0]], B = xy[(x[0] + 1) % N], P = xy[x[1]], Q = xy[(x[1] + 1) % N];
      var zi = A[2] + (B[2] - A[2]) * x[2], zj = P[2] + (Q[2] - P[2]) * x[3];
      return Math.floor((zi < zj ? x[0] : x[1]) / C);
    });
    var inner = new Array(chunks.length);
    svg.textContent = "";
    function piece(ch, into) {
      var g = document.createElementNS(NS, "g"), got;
      ["k-sleeve", "k-out", "k-in"].forEach(function (cls) {
        var path = document.createElementNS(NS, "path");
        path.setAttribute("class", cls); path.setAttribute("d", ch.d);
        g.appendChild(path);
        if (cls === "k-in") got = path;
      });
      into.appendChild(g);
      return got;
    }
    chunks.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (ch) { inner[ch.at] = piece(ch, svg); });
    if (phase > 0) {
      var ghost = document.createElementNS(NS, "g");
      ghost.setAttribute("class", "k-ghost");
      ghost.setAttribute("opacity", phase.toFixed(3));
      ghost.style.setProperty("--ga", Math.sin(Math.PI * phase).toFixed(3));   // the spectral tint, strongest midway
      chunks.forEach(function (ch) { if (haunted[ch.at]) piece(ch, ghost); });
      svg.appendChild(ghost);
    }
    return { inner: inner, unders: unders, crossings: unders.length };
  }
  /* The pulse's speed: it picks up exponentially, holds top speed a moment, and slows down the
     same way, covering exactly one lap. */
  var PULSE = { up: 220, hold: 140, k: 3, start: 0.15 };   // ms speeding up, ms at top speed, steepness, starting speed (share of top)
  function pulseAt(t) {                 // fraction of the lap covered after t ms
    var K = PULSE.k, U = PULSE.up, H = PULSE.hold, E = Math.exp(K) - 1;
    var f = PULSE.start, ramp = function (x) { return f * x + (1 - f) * ((Math.exp(K * x) - 1) / K - x) / E; };   // area under the speed curve, 0..x, per unit top speed
    var total = 2 * U * ramp(1) + H, d;
    if (t <= 0) return 0;
    if (t < U) d = U * ramp(t / U);
    else if (t < U + H) d = U * ramp(1) + (t - U);
    else if (t < 2 * U + H) d = total - U * ramp((2 * U + H - t) / U);
    else return 1;
    return d / total;
  }
  var FLIP_MS = 1100;   // how long the two strands take to pass through each other
  function initSketch() {
    $$("svg[data-knot]").forEach(function (svg) {
      if (window.KnotFig && window.KnotFig.mount(svg)) return;   // the 3-D figure (assets/js/knotfig.js); below is the flat fallback
      var fig = svg.closest("figure") || svg, cap = $("figcaption", fig);
      var own = cap ? cap.innerHTML : "", figNo = (own.match(/^\s*fig\.\s*\d+:\s*/i) || [""])[0];
      var flipped = svg.getAttribute("data-flipped") || figNo + "a trefoil? not!";
      var tube = null, raf = 0, praf = 0, timers = [], running = false, moving = false;
      var crossing = 0, s = 0;              // which crossing is being passed through; 0 as drawn, 1 swapped
      function draw(phase) {
        tube = tubeKnot(svg, trefoil, crossing, s, phase || 0);
        if (cap) cap.innerHTML = s < 0.5 ? own : flipped;
      }
      svg.setAttribute("aria-label", "A trefoil knot. Press to pass one crossing through itself.");
      function stopPulse() { cancelAnimationFrame(praf); timers.forEach(clearTimeout); timers = []; running = false; $$(".k-in.lit", svg).forEach(function (p) { p.classList.remove("lit"); }); }
      function pulse() {
        if (running || moving || reduceMotion) return;
        running = true;
        var inner = tube.inner, n = inner.length, u = tube.unders;
        // start underneath the over-strand of a random crossing
        var from = u.length ? u[(Math.random() * u.length) | 0] : (Math.random() * n) | 0, done = 0, t0 = performance.now();
        (function frame(now) {
          var upto = Math.min(n, Math.round(pulseAt(now - t0) * n));
          for (; done < upto; done++) {
            var seg = inner[(from + done) % n];
            seg.classList.add("lit");
            (function (sg) { timers.push(setTimeout(function () { sg.classList.remove("lit"); }, 160)); })(seg);
          }
          if (done < n) praf = requestAnimationFrame(frame); else running = false;
        })(t0);
      }
      function pass() {
        if (moving) return;
        stopPulse();
        if (s === 0) crossing = (Math.random() * tube.crossings) | 0;   // any one of the three will do
        var to = s === 0 ? 1 : 0;
        if (reduceMotion) { s = to; draw(); return; }
        moving = true;
        var t0 = performance.now();
        (function frame(now) {
          var t = Math.min(1, (now - t0) / FLIP_MS);
          var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;   // gentle in, gentle out
          if (t < 1) { draw(e); raf = requestAnimationFrame(frame); }
          else { moving = false; s = to; draw(); }   // risen all the way: now it is the over-strand
        })(t0);
      }
      draw();
      svg.setAttribute("role", "button"); svg.setAttribute("tabindex", "0");
      fig.addEventListener("pointerenter", pulse);
      svg.addEventListener("click", pass);
      svg.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pass(); } });
    });
  }

  /* The three surfaces on the research page. */
  function initSurfaces() {
    // disc: |z| under the pointer
    $$('.surface[data-surface="disc"]').forEach(function (el) {
      var svg = $("svg", el), probe = $(".s-probe", el), level = $(".s-level", el), rad = $("[data-radius]", el), z = $("[data-z]", el);
      var label = $(".surface-true", el), name = label.textContent;
      function clear() { probe.style.opacity = 0; label.textContent = name; }
      function move(ev) {
        var r = svg.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width * 160, y = (ev.clientY - r.top) / r.height * 160;
        var mod = Math.sqrt((x - 80) * (x - 80) + (y - 80) * (y - 80)) / 62;
        if (mod >= 1) { clear(); return; }
        probe.style.opacity = 1;
        level.setAttribute("r", (mod * 62).toFixed(1));
        rad.setAttribute("x2", x.toFixed(1)); rad.setAttribute("y2", y.toFixed(1));
        z.setAttribute("cx", x.toFixed(1)); z.setAttribute("cy", y.toFixed(1));
        label.textContent = "|z| = " + mod.toFixed(2);
      }
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerdown", function (ev) { el.classList.add("is-on"); move(ev); });
      el.addEventListener("pointerleave", function (ev) { if (ev.pointerType === "mouse") { el.classList.remove("is-on"); clear(); } });
    });

    // plane: the grid slides further than the axes, so the sheet has depth
    $$('.surface[data-surface="plane"]').forEach(function (el) {
      var svg = $("svg", el), grid = $(".s-grid", el), axes = $(".s-axes", el), dot = $("[data-origin]", el);
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      function frame() {
        raf = 0;
        var k = reduceMotion ? 1 : 0.12;
        cx += (tx - cx) * k; cy += (ty - cy) * k;
        var ax = cx * 0.1, ay = cy * 0.1;
        grid.setAttribute("transform", "translate(" + (cx * 0.34).toFixed(4) + " " + (cy * 0.34).toFixed(4) + ")");
        axes.setAttribute("transform", "translate(" + ax.toFixed(4) + " " + ay.toFixed(4) + ")");
        dot.setAttribute("cx", (80 + 68 * ax + 12 * ay).toFixed(2)); dot.setAttribute("cy", (82 - 40 * ay).toFixed(2));
        if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.003) raf = requestAnimationFrame(frame);
      }
      function aim(x, y) { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(frame); }
      el.addEventListener("pointermove", function (ev) {
        var r = svg.getBoundingClientRect();
        aim(((ev.clientX - r.left) / r.width - 0.5) * 2, (0.5 - (ev.clientY - r.top) / r.height) * 2);
      });
      el.addEventListener("pointerleave", function () { aim(0, 0); });
    });

    // sphere: a wireframe that spins about a random axis, speeding up exponentially,
    // holding top speed for a moment, and slowing down the same way
    $$('.surface[data-surface="sphere"]').forEach(function (el) {
      var front = $("[data-front]", el), back = $("[data-back]", el), pole = $("[data-pole]", el);
      function rot(a, t) {
        var c = Math.cos(t), s = Math.sin(t), v = 1 - c, x = a[0], y = a[1], z = a[2];
        return [c + x * x * v, x * y * v - z * s, x * z * v + y * s,
                y * x * v + z * s, c + y * y * v, y * z * v - x * s,
                z * x * v - y * s, z * y * v + x * s, c + z * z * v];
      }
      function mul(A, B) {
        var o = new Array(9);
        for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
        return o;
      }
      var circles = [], S = 48, i, j;
      [-60, -30, 0, 30, 60].forEach(function (deg) {
        var ph = deg * Math.PI / 180, ring = [];
        for (j = 0; j < S; j++) { var th = j / S * 6.2832; ring.push([Math.cos(ph) * Math.cos(th), Math.sin(ph), Math.cos(ph) * Math.sin(th)]); }
        circles.push(ring);
      });
      for (i = 0; i < 6; i++) {
        var la = i * Math.PI / 6, ring = [];
        for (j = 0; j < S; j++) { var t = j / S * 6.2832; ring.push([Math.cos(t) * Math.cos(la), Math.sin(t), Math.cos(t) * Math.sin(la)]); }
        circles.push(ring);
      }
      var R = mul(rot([0, 0, 1], -0.22), rot([1, 0, 0], 0.5)), busy = false;
      function render() {
        var f = "", b = "";
        circles.forEach(function (ring) {
          var P = ring.map(function (p) {
            return [80 + 62 * (R[0] * p[0] + R[1] * p[1] + R[2] * p[2]), 80 - 62 * (R[3] * p[0] + R[4] * p[1] + R[5] * p[2]), R[6] * p[0] + R[7] * p[1] + R[8] * p[2]];
          });
          var penF = false, penB = false;
          for (var k = 0; k < S; k++) {
            var a = P[k], c = P[(k + 1) % S], seg = "L" + c[0].toFixed(1) + " " + c[1].toFixed(1), start = "M" + a[0].toFixed(1) + " " + a[1].toFixed(1);
            if (a[2] + c[2] >= 0) { f += (penF ? "" : start) + seg; penF = true; penB = false; }
            else { b += (penB ? "" : start) + seg; penB = true; penF = false; }
          }
        });
        front.setAttribute("d", f); back.setAttribute("d", b);
        pole.setAttribute("transform", "translate(" + (80 + 62 * R[1]).toFixed(1) + " " + (80 - 62 * R[4]).toFixed(1) + ")");
        pole.style.opacity = R[7] >= 0 ? 1 : 0.3;
      }
      function spin() {
        if (busy || reduceMotion) return;
        busy = true;
        var u = Math.random() * 2 - 1, ph = Math.random() * 6.2832, s = Math.sqrt(1 - u * u);
        var axis = [s * Math.cos(ph), s * Math.sin(ph), u];
        var UP = 900, HOLD = 320, K = 5, TOP = 0.0095, t0 = performance.now(), prev = t0;
        function speed(t) {
          var x = t < UP ? t / UP : t < UP + HOLD ? 1 : Math.max(0, (2 * UP + HOLD - t) / UP);
          return TOP * (Math.exp(K * x) - 1) / (Math.exp(K) - 1);
        }
        function step(now) {
          var t = now - t0, dt = Math.max(0, Math.min(40, now - prev)); prev = now;
          R = mul(rot(axis, speed(Math.max(0, t - dt / 2)) * dt), R);
          render();
          if (t < 2 * UP + HOLD) requestAnimationFrame(step); else busy = false;
        }
        requestAnimationFrame(step);
      }
      render();
      el.addEventListener("pointerenter", spin);
      el.addEventListener("click", spin);
      el.addEventListener("focus", spin);
    });
  }

  /* Things that open on tap for people without a pointer: course books, surface names. */
  function initTaps() {
    $$('.course.has-book, .surface:not([data-surface="disc"])').forEach(function (el) {
      el.addEventListener("click", function () { el.classList.toggle(el.classList.contains("surface") ? "is-on" : "is-open"); });
    });
  }

  /* The theme switch's new icon (cup or wave) draws itself in after a click; see custom.css. */
  function initThemeIcon() {
    var t = 0;
    ["appearance-switcher", "appearance-switcher-mobile"].forEach(function (id) {
      var b = document.getElementById(id); if (!b) return;
      b.addEventListener("click", function () {
        root.classList.remove("theme-flipped"); void root.offsetWidth; root.classList.add("theme-flipped");
        clearTimeout(t); t = setTimeout(function () { root.classList.remove("theme-flipped"); }, 900);
      });
    });
  }

  function init() {
    initThemeIcon(); initSketch(); initKnotLab(); initPi(); initCV(); initReader(); initUnfold(); initSurfaces(); initTaps(); initInk();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
