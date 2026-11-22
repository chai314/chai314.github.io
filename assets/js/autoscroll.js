/* autoscroll: one way for the site to move the page to something.

   Every scripted scroll on the site goes through autoscroll.to(target, use). It
   - clears whatever is pinned to the top of the window (the header, the vitae section
     rail, the reader bar), so the target is never hidden under them;
   - re-aims every frame, so it still lands if the page reflows on the way (late images,
     a tab opening);
   - lets go the moment the reader scrolls, taps or presses a key themselves;
   - returns a promise that resolves once it has landed (true) or was let go (false),
     so whatever comes next (a pencil underline, a stamp) waits for the page to be still.

   Settings come from [autoscroll] in config/_default/params.toml; anything not set there
   falls back to DEFAULTS below. Each caller names a "use" (section, draw, course,
   reader), and [autoscroll.uses.<name>] can override any setting for that use alone.

   To try settings live, in the browser console:
     autoscroll.config.speed = 1            // slower glides everywhere
     autoscroll.config.uses.draw.align = "start"
     autoscroll.to("#coursework", { align: "center", easing: "in-out-cubic" })
*/
(function () {
  "use strict";

  var DEFAULTS = {
    smooth: true,          // false: jump straight there
    speed: 3,              // px per ms; a glide takes distance / speed ...
    min: 220,              // ... but never less than this many ms
    max: 850,              // ... nor more than this
    easing: "out-cubic",   // linear | out-quad | out-cubic | out-quint | in-out-cubic
    align: "start",        // start | center | nearest
    when: "always",        // always | offscreen (skip if the target is already wholly in view)
    gap: 16,               // px of air between the pinned bars and the target
    cover: ".fixed.top-0.inset-x-0, .cv-rail, .reader-bar, [data-autoscroll-cover]",
    yield: true,           // the reader's own wheel, touch or keys cancel a glide
    focus: true,           // move keyboard focus to the target after a link jump
    links: true,           // in-page #links use autoscroll too (with the "section" use)
    uses: {}
  };

  var EASE = {
    "linear": function (t) { return t; },
    "out-quad": function (t) { return 1 - (1 - t) * (1 - t); },
    "out-cubic": function (t) { return 1 - Math.pow(1 - t, 3); },
    "out-quint": function (t) { return 1 - Math.pow(1 - t, 5); },
    "in-out-cubic": function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };

  var user = window.AUTOSCROLL || {};
  var config = {};
  Object.keys(DEFAULTS).forEach(function (k) { config[k] = DEFAULTS[k]; });
  Object.keys(user).forEach(function (k) { if (k !== "uses") config[k] = user[k]; });
  config.uses = {};
  var uses = user.uses || {};
  Object.keys(uses).forEach(function (k) { config.uses[k] = uses[k] || {}; });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Settings for one call: defaults < params.toml < the use < what the caller passed. */
  function settings(use) {
    var o = {}, extra = {}, name = use;
    if (use && typeof use === "object") { extra = use; name = use.use; }
    Object.keys(config).forEach(function (k) { if (k !== "uses") o[k] = config[k]; });
    var u = (name && config.uses[name]) || {};
    Object.keys(u).forEach(function (k) { o[k] = u[k]; });
    Object.keys(extra).forEach(function (k) { if (k !== "use") o[k] = extra[k]; });
    return o;
  }

  /* How much of the top of the window is covered by pinned bars right now. */
  function cover(sel) {
    var h = 0;
    document.querySelectorAll(sel || config.cover).forEach(function (el) {
      var cs = getComputedStyle(el);
      if ((cs.position !== "fixed" && cs.position !== "sticky") || cs.display === "none" || cs.visibility === "hidden") return;
      var top = parseFloat(cs.top);
      if (isNaN(top) || top > 1 + h + 80) return;     // pinned somewhere other than the top
      h = Math.max(h, top + el.getBoundingClientRect().height);
    });
    return h;
  }

  function resolve(target) {
    if (typeof target === "string") {
      var id = target.charAt(0) === "#" ? target.slice(1) : null;
      try { id = id && decodeURIComponent(id); } catch (e) {}
      target = id ? document.getElementById(id) : document.querySelector(target);
    }
    // Blowfish puts heading ids on an empty, offset <div class="anchor"> inside the heading
    if (target && target.classList && target.classList.contains("anchor") && target.parentElement) target = target.parentElement;
    return target || null;
  }

  function maxY() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }

  /* Where the page has to be for el to sit as o asks. */
  function aim(el, o) {
    var r = el.getBoundingClientRect(), top = cover(o.cover) + o.gap, view = window.innerHeight;
    var room = view - top, y = window.scrollY, align = o.align;
    if (align === "center" && r.height > room - o.gap) align = "start";  // too tall to centre: show its top
    if (align === "start") y += r.top - top;
    else if (align === "center") y += r.top - top - (room - r.height) / 2;
    else if (align === "nearest") {
      if (r.top < top || r.height > room - o.gap) y += r.top - top;
      else if (r.bottom > view - o.gap) y += r.bottom - view + o.gap;
    }
    return Math.max(0, Math.min(maxY(), Math.round(y)));
  }

  function inView(el, use) {
    var o = settings(use), r = resolve(el).getBoundingClientRect();
    return r.top >= cover(o.cover) && r.bottom <= window.innerHeight;
  }

  var current = null;   // the glide in progress, if any
  function stop(landed) { if (current) { var c = current; current = null; c.end(landed); } }

  var INPUT_KEYS = { ArrowUp: 1, ArrowDown: 1, PageUp: 1, PageDown: 1, Home: 1, End: 1, " ": 1 };
  function onInput(ev) {
    if (!current || !current.yield) return;
    if (ev.type === "keydown" && !INPUT_KEYS[ev.key]) return;
    stop(false);
  }
  ["wheel", "touchstart", "keydown"].forEach(function (t) { window.addEventListener(t, onInput, { passive: true }); });

  function jump(y) { window.scrollTo({ top: y, left: window.scrollX, behavior: "instant" }); }

  /* Move the page to target. use is a use name ("draw"), or an object of settings,
     optionally naming a use: { use: "draw", align: "start" }. */
  function to(target, use) {
    stop(false);
    var el = resolve(target), o = settings(use);
    if (!el) return Promise.resolve(false);
    if (o.when === "offscreen" && inView(el, o)) return Promise.resolve(true);
    if (!o.smooth || reduce.matches) { jump(aim(el, o)); return Promise.resolve(true); }

    return new Promise(function (done) {
      var from = window.scrollY, dist = Math.abs(aim(el, o) - from);
      if (dist < 2) { done(true); return; }
      var ms = Math.max(o.min, Math.min(o.max, dist / Math.max(0.01, o.speed)));
      var ease = EASE[o.easing] || EASE["out-cubic"], t0 = performance.now(), raf = 0;
      var me = { yield: o.yield, end: function (landed) { cancelAnimationFrame(raf); clearTimeout(dog); done(landed); } };
      current = me;
      // a background tab gets no animation frames: if the glide has not finished in time, just arrive
      var dog = setTimeout(function () { if (current === me) { current = null; cancelAnimationFrame(raf); jump(aim(el, o)); done(true); } }, ms + 400);
      (function frame(now) {
        if (current !== me) return;
        var t = Math.min(1, (now - t0) / ms), goal = aim(el, o);     // re-aimed every frame
        jump(from + (goal - from) * ease(t));
        if (t < 1) raf = requestAnimationFrame(frame);
        else { current = null; clearTimeout(dog); done(true); }
      })(t0);
    });
  }

  function focusOn(el) {
    if (!el.matches("a[href], button, input, select, textarea, [tabindex]")) el.setAttribute("tabindex", "-1");
    try { el.focus({ preventScroll: true }); } catch (e) {}
  }

  /* In-page links: #section links anywhere on the site glide too, and clear the bars. */
  document.addEventListener("click", function (ev) {
    if (!config.links || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest && ev.target.closest('a[href*="#"]');
    if (!a || a.hasAttribute("data-autoscroll-off") || a.origin !== location.origin || a.pathname !== location.pathname || a.hash.length < 2) return;
    var el = resolve(a.hash);
    if (!el) return;
    ev.preventDefault();
    if (location.hash !== a.hash) history.pushState(null, "", a.hash);
    var o = settings(a.getAttribute("data-autoscroll") || "section");
    to(el, o);
    if (o.focus) focusOn(el);
  });

  /* Arriving with a #hash, or going back and forward between them: land clear of the bars. */
  function toHash() { if (location.hash.length > 1) { var el = resolve(location.hash); if (el) to(el, { use: "section", smooth: false }); } }
  window.addEventListener("popstate", toHash);
  window.addEventListener("load", function () {
    if (!config.links || location.hash.length < 2) return;
    var el = resolve(location.hash); if (!el) return;
    // land now, and keep the target where it landed while late fonts, images and counters
    // settle the layout above it, until the reader moves the page or two seconds pass
    var o = settings({ use: "section", smooth: false }), hold = function () { jump(aim(el, o)); };
    hold();
    if (!window.ResizeObserver) return;
    var ro = new ResizeObserver(hold), done = function () { ro.disconnect(); ["wheel", "touchstart", "keydown"].forEach(function (t) { window.removeEventListener(t, done); }); };
    ro.observe(document.body);
    ["wheel", "touchstart", "keydown"].forEach(function (t) { window.addEventListener(t, done, { passive: true }); });
    setTimeout(done, 2000);
  });

  window.autoscroll = { to: to, stop: function () { stop(false); }, cover: cover, inView: inView, config: config, ease: EASE };
})();
