/* walks: the sentence "The number of lattice walks of length n in 3D is ...", used by the
   walks shortcode. Two loose phrases float below it; pressing one opens the gap it belongs in.
   Drag it there (or click it, or press Enter on it) and the count follows. Drag it out again, or
   click it, to let it go.

   n is a little wheel: drag it up or down, flick it, or click a neighbour. It also takes focus:
   arrow keys, Page Up / Down, Home, End, or type.

   What is counted, all starting at the origin of Z^3:
     neither phrase        6^n, exact
     self-avoiding         OEIS A001412, exact to n = 36
     start = end           OEIS A002896, exact (closed form)
     both                  OEIS A001413, exact to n = 32 (polygons with a start and a direction)
   Past those the figures in EST are extrapolations, A mu^n n^x (1 + b/n) with mu = 4.684039931,
   fitted to the last known terms, to four digits, shown with CFG.est in front.

   Settings: [walks] in config/_default/params.toml, falling back to CFG. */
(function () {
  "use strict";

  var CFG = { n: 34, max: 40, drift: 22, est: "≈" };
  var user = window.WALKS || {};
  Object.keys(CFG).forEach(function (k) { if (k in user) CFG[k] = user[k]; });

  var SAW = ["1", "6", "30", "150", "726", "3534", "16926", "81390", "387966", "1853886", "8809878", "41934150",
    "198842742", "943974510", "4468911678", "21175146054", "100121875974", "473730252102", "2237723684094",
    "10576033219614", "49917327838734", "235710090502158", "1111781983442406", "5245988215191414",
    "24730180885580790", "116618841700433358", "549493796867100942", "2589874864863200574",
    "12198184788179866902", "57466913094951837030", "270569905525454674614", "1274191064726416905966",
    "5997359460809616886494", "28233744272563685150118", "132853629626823234210582",
    "625248129452557974777990", "2941370856334701726560670"];
  // indexed by n / 2
  var SAP = ["1", "0", "24", "264", "3312", "48240", "762096", "12673920", "218904768", "3891176352", "70742410800",
    "1309643747808", "24609869536800", "468270744898944", "9005391024862848", "174776445357365040", "3419171337633496704"];
  var EST = {
    avoid: { 37: [1.384, 25], 38: [6.509, 25], 39: [3.061, 26], 40: [1.440, 27] },
    both: { 34: [6.736, 19], 36: [1.335, 21], 38: [2.662, 22], 40: [5.332, 23] }
  };
  CFG.max = Math.min(CFG.max, 40);   // the tables above end here

  function fact(k) { var r = BigInt(1); for (var i = 2; i <= k; i++) r *= BigInt(i); return r; }
  function count(n, avoid, closed) {
    if (closed && n % 2) return { exact: "0" };
    var kind = avoid && closed ? "both" : "avoid";
    if (avoid) {
      var known = closed ? SAP[n / 2] : SAW[n];
      return known !== undefined ? { exact: known } : { est: EST[kind][n] };
    }
    if (!closed) { var p = BigInt(1); for (var i = 0; i < n; i++) p *= BigInt(6); return { exact: String(p) }; }
    var m = n / 2, sum = BigInt(0), top = fact(n);
    for (var a = 0; a <= m; a++) for (var b = 0; a + b <= m; b++) {
      var d = fact(a) * fact(b) * fact(m - a - b);
      sum += top / (d * d);
    }
    return { exact: String(sum) };
  }
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }

  /* Something that turns: follows the hand, coasts when flicked, settles on a whole number.
     o: node to grab, axis "x" or "y", unit() px per step, get, set(n), paint(position), wake, reduce. */
  function turner(o) {
    var pos = o.get(), v = 0, held = null, moved = false, aim = null, at = o.axis === "x" ? "clientX" : "clientY";
    function clamp(x) { return Math.max(1, Math.min(CFG.max, x)); }
    function tell() { var k = clamp(Math.round(pos)); if (k !== o.get()) o.set(k); }
    o.node.addEventListener("pointerdown", function (ev) {
      if (ev.button) return;
      held = { id: ev.pointerId, p: ev[at], pos: pos, t: performance.now(), last: pos };
      v = 0; aim = null; moved = false;
    });
    window.addEventListener("pointermove", function (ev) {
      if (!held || ev.pointerId !== held.id) return;
      var d = (held.p - ev[at]) / o.unit();
      if (!moved && Math.abs(d) * o.unit() < 4) return;
      if (!moved) { moved = true; o.node.classList.add("is-held"); }
      var want = held.pos + d, inside = clamp(want), now = performance.now(), dt = Math.max(1, now - held.t);
      pos = inside + (want - inside) * 0.25;                 // the ends give a little
      v = 0.6 * v + 0.4 * ((pos - held.last) / dt); held.t = now; held.last = pos;
      tell(); o.paint(pos); o.wake();
    });
    function up(ev) {
      if (!held || (ev.pointerId !== undefined && ev.pointerId !== held.id)) return;
      if (performance.now() - held.t > 80) v = 0;            // held still before letting go: no flick
      held = null; o.node.classList.remove("is-held");
      aim = clamp(Math.round(pos + (moved && !o.reduce.matches ? Math.max(-9, Math.min(9, v * 190)) : 0)));
      o.wake();
    }
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", function () { up({}); });
    return {
      moved: function () { return moved; },
      busy: function () { return !!held || aim !== null; },
      to: function (n) { aim = n; o.wake(); },
      tick: function (dt) {
        if (held || aim === null) return;
        pos += (aim - pos) * (o.reduce.matches ? 1 : 1 - Math.exp(-dt / 85));
        if (Math.abs(aim - pos) < 0.004) { pos = aim; aim = null; }
        tell(); o.paint(pos);
      },
      paint: function () { o.paint(pos); }
    };
  }

  /* The number is a wheel set into the sentence; its neighbours show above and below.
     c: {num, get, set (from the hand), jump (a whole step), wake, reduce}. */
  function wheel(c) {
    var rows = [], k, T, say;
    c.num.textContent = "";
    say = el("span", "walks-n-say", c.num);
    for (k = 1; k <= CFG.max; k++) { rows[k] = el("span", "walks-row", c.num); rows[k].textContent = k; rows[k].setAttribute("aria-hidden", "true"); }
    function unit() { return parseFloat(getComputedStyle(c.num).fontSize) * 1.02; }
    function paint(pos) {
      var u = unit();
      for (var i = 1; i <= CFG.max; i++) {
        var d = i - pos, a = Math.abs(d), st = rows[i].style;
        if (a > 1.9) { st.visibility = "hidden"; continue; }
        st.visibility = "";
        st.transform = "translateY(" + (Math.sin(Math.max(-1.5, Math.min(1.5, d * 0.95))) * u * 1.12).toFixed(2) + "px) scale(" + (1 - 0.24 * a).toFixed(3) + ")";
        st.opacity = (a < 1 ? 1 - 0.58 * a : 0.42 * (1.9 - a) / 0.9).toFixed(3);
      }
    }
    T = turner({ node: c.num, axis: "y", unit: unit, get: c.get, set: c.set, paint: paint, wake: c.wake, reduce: c.reduce });
    c.num.addEventListener("click", function (ev) {        // a click on a neighbour steps to it
      if (T.moved() || !ev.detail) return;
      var r = c.num.getBoundingClientRect(), y = ev.clientY - (r.top + r.height / 2);
      if (Math.abs(y) > unit() * 0.5) c.jump(c.get() + (y > 0 ? 1 : -1));
    });
    return { show: function (n, byHand) { say.textContent = n; if (!byHand) T.to(n); }, tick: T.tick, paint: T.paint };
  }

  function init(root) {
    var $ = function (s) { return root.querySelector(s); };
    var num = $(".walks-n"), valueEl = $(".walks-value"), air = $(".walks-air"), live = $("[data-walks-live]");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.classList.add("is-live");
    air.hidden = false;

    var n = Math.max(1, Math.min(CFG.max, CFG.n)), on = { avoid: false, closed: false }, later = 0;

    function say(quiet) {
      var c = count(n, on.avoid, on.closed);
      valueEl.innerHTML = c.exact ? commas(c.exact).replace(/,/g, ",<wbr>")
        : CFG.est + "&nbsp;" + c.est[0].toFixed(3) + "&nbsp;×&nbsp;10<sup>" + c.est[1] + "</sup>";
      num.setAttribute("aria-valuenow", n);
      clearTimeout(later);
      if (!quiet) later = setTimeout(function () {
        live.textContent = "The number of " + (on.avoid ? "self-avoiding " : "") + "lattice walks of length " + n + (on.closed ? " that start where they end" : "") +
          " in 3D is " + (c.exact ? commas(c.exact) : CFG.est + " " + c.est[0].toFixed(3) + " × 10^" + c.est[1]);
      }, 500);
    }
    function setN(k, byHand) {
      k = Math.max(1, Math.min(CFG.max, k));
      if (k === n) return;
      n = k; say(); control.show(n, byHand === true); wake();
    }
    num.setAttribute("aria-valuemin", 1); num.setAttribute("aria-valuemax", CFG.max);
    var control = wheel({
      num: num, reduce: reduce,
      get: function () { return n; },
      set: function (k) { setN(k, true); },
      jump: function (k) { setN(k); },
      wake: function () { wake(); }
    });

    var typed = "", typedAt = 0;
    num.addEventListener("keydown", function (e) {
      var k = e.key, to = null;
      if (k === "ArrowUp" || k === "ArrowRight") to = n + 1;
      else if (k === "ArrowDown" || k === "ArrowLeft") to = n - 1;
      else if (k === "PageUp") to = n + 5;
      else if (k === "PageDown") to = n - 5;
      else if (k === "Home") to = 1;
      else if (k === "End") to = CFG.max;
      else if (/^\d$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        typed = performance.now() - typedAt < 900 ? typed + k : k; typedAt = performance.now();
        if (+typed > CFG.max) typed = k;
        if (+typed >= 1) to = +typed;
      }
      if (to !== null) { e.preventDefault(); setN(to); }
    });

    /* --- the loose phrases --- */
    var phrases = Array.prototype.map.call(root.querySelectorAll(".walks-phrase"), function (b, i) {
      b.hidden = false;
      var key = b.getAttribute("data-phrase"), slot = $('[data-slot="' + key + '"]');
      return { el: b, key: key, slot: slot, text: slot.firstChild, fx: i ? 0.9 : 0.1, fy: i ? 0.66 : 0.3,
        clock: i * 5200, pace: i ? 0.9 : 1.07, x: 0, y: 0, r: 0, set: false, locked: false, hold: null };
    });
    function box() { return root.getBoundingClientRect(); }
    function attach(p, yes) {
      if (on[p.key] === yes) return;
      on[p.key] = yes; p.locked = false;
      p.el.classList.toggle("is-in", yes);
      p.el.setAttribute("aria-pressed", yes);
      p.slot.classList.toggle("is-full", yes);
      root.setAttribute("data-in", +on.avoid + +on.closed);
      p.text.textContent = yes ? (p.key === "closed" ? "that start where they end" : "self-avoiding") : "";   // for copying; the phrase sits over it
      size(p); say(); wake();
    }
    function size(p) { p.slot.style.width = on[p.key] ? p.el.offsetWidth + "px" : ""; }
    function dist(r, x, y) { var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom); return Math.sqrt(dx * dx + dy * dy); }
    function closeTo(p, ev) {
      var s = p.slot.getBoundingClientRect(), b = p.el.getBoundingClientRect();
      return Math.min(dist(s, b.left + b.width / 2, b.top + b.height / 2), dist(s, ev.clientX, ev.clientY)) < 46;
    }
    phrases.forEach(function (p) {
      p.el.addEventListener("pointerdown", function (ev) {
        if (ev.button) return;
        p.hold = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, moved: false }; p.dragged = false;
        // the gap it belongs in opens on the press, so a finger sees where it goes before it moves
        p.el.classList.add("is-held");
        if (!on[p.key]) p.slot.classList.add("is-open");
      });
      p.el.addEventListener("click", function (ev) {
        if (p.dragged && ev.detail) { p.dragged = false; return; }   // that was a drag
        attach(p, !on[p.key]);
      });
    });
    window.addEventListener("pointermove", function (ev) {
      phrases.forEach(function (p) {
        var h = p.hold; if (!h || ev.pointerId !== h.id) return;
        if (!h.moved) {
          var dx = ev.clientX - h.x0, dy = ev.clientY - h.y0;
          if (dx * dx + dy * dy < 25) return;
          h.moved = p.dragged = true;
          attach(p, false);
          h.w = p.el.offsetWidth; h.h = p.el.offsetHeight;
          root.classList.add("is-carrying"); p.slot.classList.add("is-open");
        }
        var b = box();
        p.x = Math.min(b.width - h.w, Math.max(0, ev.clientX - b.left - h.w / 2));
        p.y = Math.min(b.height - h.h, Math.max(0, ev.clientY - b.top - h.h / 2));
        p.r = 0; paint(p);
        p.slot.classList.toggle("is-near", closeTo(p, ev));
      });
    });
    function release(ev) {
      phrases.forEach(function (p) {
        var h = p.hold; if (!h || (ev.pointerId !== undefined && ev.pointerId !== h.id)) return;
        p.hold = null;
        var take = ev.type === "pointerup" && p.slot.classList.contains("is-near");
        p.el.classList.remove("is-held"); root.classList.remove("is-carrying"); p.slot.classList.remove("is-open", "is-near");
        wake();
        if (!h.moved) return;
        if (take) attach(p, true);                 // otherwise it floats back down
        setTimeout(function () { p.dragged = false; }, 0);
        wake();
      });
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", function () { release({ type: "blur" }); });

    function paint(p) { p.el.style.transform = "translate(" + p.x.toFixed(2) + "px," + p.y.toFixed(2) + "px) rotate(" + p.r.toFixed(2) + "deg)"; }
    function place(p, dt) {
      if (p.hold && (p.hold.moved || !on[p.key])) return;   // in the hand, or held down where it floats
      var tx, ty, tr = 0, w = p.el.offsetWidth, h = p.el.offsetHeight;
      if (on[p.key]) {
        var b = box(), s = p.slot.getBoundingClientRect();
        tx = s.left - b.left; ty = s.top - b.top + (s.height - h) / 2;
      } else {
        if (!reduce.matches && !p.el.matches(":hover, :focus-visible")) p.clock += dt * p.pace;
        var t = p.clock / 1000, W = root.clientWidth - w, a = reduce.matches ? 0 : Math.min(CFG.drift, W * 0.07), H = Math.max(0, air.offsetHeight - h);
        tx = Math.min(W, Math.max(0, p.fx * W + a * (0.75 * Math.sin(t * 0.62) + 0.25 * Math.sin(t * 1.37))));
        ty = air.offsetTop + Math.min(H, Math.max(0, p.fy * H + a * 0.62 * (0.7 * Math.sin(t * 0.91 + 1) + 0.3 * Math.sin(t * 1.9))));
        tr = reduce.matches ? 0 : 3.2 * Math.sin(t * 0.74 + 2);
      }
      if (!p.set || p.locked) { p.x = tx; p.y = ty; p.r = tr; p.set = true; }
      else {
        var k = reduce.matches ? 1 : 1 - Math.exp(-dt / 60);
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k; p.r += (tr - p.r) * k;
        if (on[p.key] && Math.abs(tx - p.x) + Math.abs(ty - p.y) < 0.6) p.locked = true;
      }
      paint(p);
    }

    /* --- one loop for everything that moves, stopped when the figure is off screen --- */
    var raf = 0, seen = true, last = 0;
    function frame(now) {
      raf = 0;
      var dt = Math.min(50, last ? now - last : 16); last = now;
      control.tick(dt);
      phrases.forEach(function (p) { place(p, dt); });
      if (seen && !document.hidden) wake();
    }
    function wake() { if (!raf) raf = requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[es.length - 1].isIntersecting; last = 0; if (seen) wake(); }).observe(root);
    document.addEventListener("visibilitychange", function () { last = 0; if (!document.hidden) wake(); });

    function measure() { phrases.forEach(size); control.paint(); wake(); }
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(root); else window.addEventListener("resize", measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    say(true); control.show(n, true); control.paint(); wake();
    // for the console and for tests
    root.walks = { set: setN, state: function () { return { n: n, on: on }; }, count: count,
      run: function (ms) { for (var t = 0; t < ms; t += 16) { control.tick(16); phrases.forEach(function (p) { place(p, 16); }); } } };
  }

  function start() { Array.prototype.forEach.call(document.querySelectorAll("[data-walks]"), init); }
  if (typeof BigInt === "undefined") return;   // a very old browser keeps the plain sentence
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
