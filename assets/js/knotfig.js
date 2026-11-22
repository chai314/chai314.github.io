/* fig. 2 on the home page: the trefoil as a real three-dimensional tube.
   A click makes one crossing's under-strand rise up through its over-strand, which then sinks,
   so the two trade places and the knot comes undone; a second click passes them back.
   Drawn with WebGL2 as an inked tube with real depth, so the strands truly cut through each other:
   a glowing seam marks where one tube enters the other, and the buried part shows through as an
   x-ray outline. Without WebGL2 the flat drawing in site.js stays. */
(function () {
  "use strict";

  var TAU = Math.PI * 2;
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CFG = {
    pass: 1750,      // ms for one crossing pass, camera tilt included
    tilt: 0.5,       // radians the camera leans in to look at the crossing from the side
    sigma: 0.21,     // width of the lift along the curve, in curve parameter
    zLift: 1.45,     // depth exaggeration, so over and under are far enough apart to read
    radius: 0.066,   // tube radius, in units where the knot spans about 1.64
    halo: 0.112      // paper sleeve radius: the gap that makes a crossing read as a crossing
  };

  /* ------------------------------------------------------------------ */
  /* Geometry                                                            */
  /* ------------------------------------------------------------------ */
  function rawP(t) { return [Math.sin(t) + 2 * Math.sin(2 * t), -(Math.cos(t) - 2 * Math.cos(2 * t)), -Math.sin(3 * t)]; }
  function wrap(d) { d = (d + Math.PI) % TAU; if (d < 0) d += TAU; return d - Math.PI; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  function makeKnot() {
    var S = 720, raw = [], i, j;
    for (i = 0; i < S; i++) raw.push(rawP(i / S * TAU));
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    raw.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var sc = 1.64 / Math.max(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    var place = function (p) { return [(p[0] - cx) * sc, (p[1] - cy) * sc, p[2] * sc * CFG.zLift]; };
    var pts = raw.map(place), xs = [];
    // the crossings of the shadow: which pair of parameters lands on the same point
    for (i = 0; i < S; i++) for (j = i + 2; j < S; j++) {
      if (i === 0 && j === S - 1) continue;
      var A = pts[i], B = pts[(i + 1) % S], P = pts[j], Q = pts[(j + 1) % S];
      var den = (B[0] - A[0]) * (Q[1] - P[1]) - (B[1] - A[1]) * (Q[0] - P[0]);
      if (Math.abs(den) < 1e-12) continue;
      var u = ((P[0] - A[0]) * (Q[1] - P[1]) - (P[1] - A[1]) * (Q[0] - P[0])) / den;
      var v = ((P[0] - A[0]) * (B[1] - A[1]) - (P[1] - A[1]) * (B[0] - A[0])) / den;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
      var ti = (i + u) / S * TAU, tj = (j + v) / S * TAU, zi = A[2] + (B[2] - A[2]) * u, zj = P[2] + (Q[2] - P[2]) * v;
      var lo = zi < zj;
      xs.push({ tU: lo ? ti : tj, tO: lo ? tj : ti, zU: Math.min(zi, zj), zO: Math.max(zi, zj), x: A[0] + (B[0] - A[0]) * u, y: A[1] + (B[1] - A[1]) * u });
    }
    return { place: place, crossings: xs };
  }

  function lift(t, t0) { var d = wrap(t - t0) / CFG.sigma; return Math.exp(-d * d); }

  /* The curve with crossing st.c part way through its pass: the original under-strand raised by
     kU of the gap, the original over-strand lowered by kO of it. At 1 and 1 they have swapped. */
  function point(K, t, st) {
    var p = K.place(rawP(t));
    if (st && st.c != null) {
      var x = K.crossings[st.c], D = x.zO - x.zU;
      p[2] += D * (st.kU * lift(t, x.tU) - st.kO * lift(t, x.tO));
    }
    return p;
  }
  function frameAt(K, t, st) {
    var h = 1e-3, c = point(K, t, st), T = norm(sub(point(K, t + h, st), point(K, t - h, st)));
    var N = norm(cross(T, [0, 0, 1])), B = cross(T, N);
    return { c: c, T: T, N: N, B: B };
  }
  /* how much of the pass this part of the curve takes part in: positive along the under-strand's
     stretch, negative along the over-strand's */
  function sideWeight(K, t, st) {
    if (!st || st.c == null) return 0;
    var x = K.crossings[st.c], u = lift(t, x.tU), o = lift(t, x.tO);
    return u >= o ? u : -o;
  }

  /* camera: lean about the line from the centre through the crossing, so that crossing stays put */
  function tiltMatrix(K, c, angle) {
    if (!angle || c == null) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    var x = K.crossings[c], a = norm([x.x, x.y, 0]), s = Math.sin(angle), co = Math.cos(angle), k = 1 - co;
    return [
      co + a[0] * a[0] * k, a[0] * a[1] * k - a[2] * s, a[0] * a[2] * k + a[1] * s,
      a[1] * a[0] * k + a[2] * s, co + a[1] * a[1] * k, a[1] * a[2] * k - a[0] * s,
      a[2] * a[0] * k - a[1] * s, a[2] * a[1] * k + a[0] * s, co + a[2] * a[2] * k
    ];
  }
  function colMajor(R) { return new Float32Array([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]); }

  /* ------------------------------------------------------------------ */
  /* Timing                                                              */
  /* ------------------------------------------------------------------ */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, x) { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  /* the hover pulse: speeds up exponentially, holds, slows the same way, one lap */
  var PULSE = { up: 220, hold: 140, k: 3, start: 0.15 };
  function pulseAt(t) {
    var K = PULSE.k, U = PULSE.up, H = PULSE.hold, E = Math.exp(K) - 1, f = PULSE.start;
    var ramp = function (x) { return f * x + (1 - f) * ((Math.exp(K * x) - 1) / K - x) / E; };
    var total = 2 * U * ramp(1) + H, d;
    if (t <= 0) return 0;
    if (t < U) d = U * ramp(t / U);
    else if (t < U + H) d = U * ramp(1) + (t - U);
    else if (t < 2 * U + H) d = total - U * ramp((2 * U + H - t) / U);
    else return 1;
    return d / total;
  }

  function palette() {
    var cs = getComputedStyle(root);
    var get = function (n) { return (cs.getPropertyValue(n).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(function (v) { return v / 255; }); };
    return { paper: get("--paper"), ink: get("--ink"), accent: get("--accent") };
  }

  function sizeCanvas(cv, cap) {
    var w = cv.clientWidth || 160, dpr = Math.min(window.devicePixelRatio || 1, cap || 2);
    var px = Math.max(64, Math.round(w * dpr));
    if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
    return px;
  }

  /* ------------------------------------------------------------------ */
  /* WebGL helpers                                                       */
  /* ------------------------------------------------------------------ */
  function program(gl, vs, fs) {
    var mk = function (type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    var v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i), name = info.name.replace(/\[0\]$/, ""); u[name] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }
  function loseGL(gl) { var e = gl && gl.getExtension("WEBGL_lose_context"); if (e) e.loseContext(); }

  /* ------------------------------------------------------------------ */
  /* The renderer: an inked 3-D tube. Ink is drawn where the surface turns   */
  /*    away from the eye, paper where it faces it, so the tube reads as */
  /*    the same hollow pen drawing as the rest of the page. Depth is    */
  /*    real, so the strands truly cut through each other; the part of a */
  /*    strand hidden inside the other glows through as an outline.      */
  /* ------------------------------------------------------------------ */
  var XRAY_VS = "#version 300 es\n" +
    "layout(location=0) in vec3 aC; layout(location=1) in vec3 aN; layout(location=2) in float aU; layout(location=3) in float aW; layout(location=4) in vec3 aT;\n" +
    "uniform mat3 uR; uniform float uRad, uBias;\n" +
    "out vec3 vN; out vec3 vP; out vec3 vT; out float vU; out float vW;\n" +
    "void main(){ vec3 p = aC + uRad*aN; vP = p; vec3 q = uR*p; vN = uR*aN; vT = uR*aT; vU = aU; vW = aW;\n" +
    // the sleeve is pushed back a little, so on a steep strand it never laps over its own tube
    "  gl_Position = vec4(q.x, -q.y, -q.z*0.5 + uBias, 1.0); }";   // flat projection: the eye faces every point the same way
  var XRAY_FS = "#version 300 es\nprecision highp float;\n" +
    "in vec3 vN; in vec3 vP; in vec3 vT; in float vU; in float vW;\n" +
    "uniform vec3 uPaper, uInk, uAccent, uContact, uAxU, uDirU, uAxO, uDirO; uniform int uMode; uniform float uHead, uI, uTime, uRad;\n" +
    "out vec4 o;\n" +
    "void main(){\n" +
    "  if (uMode == 0) { o = vec4(uPaper, 1.0); return; }\n" +
    // how squarely this point faces the eye, as a share of the most any point round the tube can here
    "  vec3 n = normalize(vN); float tz = normalize(vT).z;\n" +
    "  float nz = min(1.0, abs(n.z) / max(sqrt(1.0 - tz * tz), 0.05)); float fw = max(fwidth(nz), 0.002) * 1.1;\n" +
    "  float ink = 1.0 - smoothstep(0.8 - fw, 0.8 + fw, nz);\n" +
    "  float d = distance(vP, uContact) / (uRad * 3.4);\n" +
    "  float near = uI * pow(max(0.0, 1.0 - d), 2.0);\n" +
    // the seam: where this strand's surface meets the other strand's surface, i.e. the line along which
    // one tube is cutting into the other. vW > 0 on the under-strand's stretch, < 0 on the over-strand's.
    "  float w = abs(vW); vec3 ax = vW > 0.0 ? uAxO : uAxU; vec3 dir = vW > 0.0 ? uDirO : uDirU;\n" +
    "  float dax = length(cross(vP - ax, dir));\n" +
    "  float sw = max(fwidth(dax), 0.0015) * 1.5;\n" +
    "  float seam = step(0.002, uI) * smoothstep(0.3, 0.6, w) * (1.0 - smoothstep(sw * 0.5, sw * 2.5, abs(dax - uRad)));\n" +
    "  vec3 glow = mix(uAccent, vec3(1.0), 0.35);\n" +
    // x-ray: the buried part of either strand, as a glowing outline with a faint body
    "  if (uMode == 2) {\n" +
    "    if (n.z < 0.0) discard;\n" +   // only the side of the buried strand that faces us
    "    float g = clamp(uI * 1.8, 0.0, 1.0) * smoothstep(0.05, 0.4, w);\n" +
    "    float a = g * (0.18 + 0.82 * ink);\n" +
    "    o = vec4(mix(uAccent, glow, seam), clamp(a + seam * g, 0.0, 0.95)); return;\n" +
    "  }\n" +
    "  float lit = 0.0; if (uHead >= 0.0) { float b = fract(uHead - vU); lit = b < 0.08 ? pow(1.0 - b / 0.08, 2.0) : 0.0; }\n" +
    "  vec3 L = normalize(vec3(-0.45, -0.55, 0.7)); float diff = clamp(dot(n, L), 0.0, 1.0);\n" +
    "  vec3 paper = mix(uPaper, uInk, 0.09 * (1.0 - diff));\n" +
    "  paper = mix(paper, uAccent, max(lit, near * 0.22));\n" +
    "  vec3 inkc = mix(uInk, uAccent, near * 0.7);\n" +
    "  vec3 col = mix(paper, inkc, ink);\n" +
    "  o = vec4(mix(col, glow, seam), 1.0);\n" +
    "}";

  function makeXray(cv) {
    var gl = cv.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    var pr = program(gl, XRAY_VS, XRAY_FS);
    if (!pr) { loseGL(gl); return null; }
    var M = 440, R = 22, NV = M * R, data = new Float32Array(NV * 11);
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    [[0, 3, 0], [1, 3, 12], [2, 1, 24], [3, 1, 28], [4, 3, 32]].forEach(function (a) { gl.enableVertexAttribArray(a[0]); gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, 44, a[2]); });
    var idx = new Uint16Array(M * R * 6), q = 0, i, j;
    for (i = 0; i < M; i++) for (j = 0; j < R; j++) {
      var a = i * R + j, b = ((i + 1) % M) * R + j, c = ((i + 1) % M) * R + (j + 1) % R, d = i * R + (j + 1) % R;
      idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = a; idx[q++] = c; idx[q++] = d;
    }
    var ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    var cosT = [], sinT = [];
    for (j = 0; j < R; j++) { cosT.push(Math.cos(j / R * TAU)); sinT.push(Math.sin(j / R * TAU)); }

    function fill(F) {
      var o = 0;
      for (i = 0; i < M; i++) {
        var t = i / M * TAU, fr = frameAt(F.K, t, F.st), w = sideWeight(F.K, t, F.st);
        for (j = 0; j < R; j++) {
          var nx = cosT[j] * fr.N[0] + sinT[j] * fr.B[0], ny = cosT[j] * fr.N[1] + sinT[j] * fr.B[1], nz = cosT[j] * fr.N[2] + sinT[j] * fr.B[2];
          data[o++] = fr.c[0]; data[o++] = fr.c[1]; data[o++] = fr.c[2];
          data[o++] = nx; data[o++] = ny; data[o++] = nz;
          data[o++] = i / M; data[o++] = w;
          data[o++] = fr.T[0]; data[o++] = fr.T[1]; data[o++] = fr.T[2];
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    }
    return {
      draw: function (F) {
        var px = sizeCanvas(cv, 2);
        gl.viewport(0, 0, px, px);
        fill(F);
        gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(pr.p); gl.bindVertexArray(vao);
        var u = pr.u;
        gl.uniformMatrix3fv(u.uR, false, colMajor(F.R));
        gl.uniform3fv(u.uPaper, F.pal.paper); gl.uniform3fv(u.uInk, F.pal.ink); gl.uniform3fv(u.uAccent, F.pal.accent);
        gl.uniform3fv(u.uContact, F.contact); gl.uniform1f(u.uHead, F.head); gl.uniform1f(u.uI, F.I); gl.uniform1f(u.uTime, F.time);
        // the two strands' axes where they cross, for the seam where one cuts into the other
        var cx = F.K.crossings[F.st.c], fu = frameAt(F.K, cx.tU, F.st), fo = frameAt(F.K, cx.tO, F.st);
        gl.uniform3fv(u.uAxU, fu.c); gl.uniform3fv(u.uDirU, fu.T); gl.uniform3fv(u.uAxO, fo.c); gl.uniform3fv(u.uDirO, fo.T);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);   // depth alone decides what shows, so no winding convention to get wrong
        // the paper sleeve, pushed back in depth (0.32 units) by more than the sleeve of a steep strand
        // rises over its own tube a little further along; it still covers whatever passes underneath a
        // crossing, whose strands are about 0.63 apart, and that gap is what makes a crossing read
        gl.uniform1f(u.uRad, CFG.halo); gl.uniform1i(u.uMode, 0); gl.uniform1f(u.uBias, 0.16);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
        gl.uniform1f(u.uRad, CFG.radius); gl.uniform1i(u.uMode, 1); gl.uniform1f(u.uBias, 0);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
        if (F.I > 0.004) {          // the hidden part of each passing strand, drawn only where something covers it
          gl.depthFunc(gl.GREATER); gl.depthMask(false); gl.enable(gl.BLEND);
          gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          gl.uniform1i(u.uMode, 2);
          gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
          gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
        }
      },
      destroy: function () { loseGL(gl); }
    };
  }

  /* ------------------------------------------------------------------ */
  /* The figure                                                          */
  /* ------------------------------------------------------------------ */
  function mount(svg) {
    var fig = svg.closest("figure") || svg.parentNode, cap = fig.querySelector("figcaption");
    var own = cap ? cap.innerHTML : "", figNo = (own.match(/^\s*fig\.\s*\d+:\s*/i) || [""])[0];
    var flippedText = svg.getAttribute("data-flipped") || figNo + "a trefoil? not!";
    var K = makeKnot();
    if (K.crossings.length < 3) return false;
    var cv = document.createElement("canvas");
    cv.className = "knot3d";
    svg.parentNode.insertBefore(cv, svg);
    var rend = makeXray(cv);
    if (!rend) { cv.remove(); return false; }    // no WebGL2: site.js draws the flat knot instead
    var pal = palette(), flipped = false, crossing = 0, anim = null, pulse = null, raf = 0;

    function state(kU, kO) { return { c: crossing, kU: kU, kO: kO }; }
    function frame(now) {
      raf = 0;
      var k = flipped ? 1 : 0, tilt = 0, I = 0, kk = 0;
      if (anim) {
        var t = clamp01((now - anim.t0) / CFG.pass);
        // lean in, pass, lean back: the crossing moves while the camera is at its steepest
        tilt = CFG.tilt * smooth(0, 0.3, t) * (1 - smooth(0.7, 1, t));
        kk = inOut(clamp01((t - 0.16) / 0.68));
        k = anim.from + (anim.to - anim.from) * kk;
        I = Math.sin(Math.PI * kk);
        if (!anim.said && kk >= 0.5) { anim.said = true; if (cap) cap.innerHTML = anim.to === 1 ? flippedText : own; }
        if (t >= 1) { flipped = anim.to === 1; anim = null; k = flipped ? 1 : 0; I = 0; tilt = 0; }
      }
      var head = -1;
      if (pulse) {
        var f = pulseAt(now - pulse.t0);
        if (f >= 1) pulse = null; else head = (pulse.u0 + f) % 1;
      }
      var x = K.crossings[crossing];
      var F = {
        K: K, st: state(k, k), R: tiltMatrix(K, crossing, tilt), I: I, kk: kk, time: now / 1000, head: head, pal: pal,
        contact: [x.x, x.y, (x.zU + x.zO) / 2]
      };
      rend.draw(F);
      if (anim || pulse) raf = requestAnimationFrame(frame);
    }
    function redraw() { if (!raf) raf = requestAnimationFrame(frame); }

    function pass() {
      if (anim) return;
      pulse = null;
      if (!flipped) crossing = (Math.random() * K.crossings.length) | 0;   // any one of the three will do
      if (reduceMotion) { flipped = !flipped; if (cap) cap.innerHTML = flipped ? flippedText : own; redraw(); return; }
      anim = { t0: performance.now(), from: flipped ? 1 : 0, to: flipped ? 0 : 1, said: false };
      redraw();
    }
    function startPulse() {
      if (anim || pulse || reduceMotion) return;
      var x = K.crossings[(Math.random() * K.crossings.length) | 0];
      pulse = { t0: performance.now(), u0: (flipped && x === K.crossings[crossing] ? x.tO : x.tU) / TAU };   // start underneath an over-strand
      redraw();
    }

    cv.setAttribute("role", "button"); cv.setAttribute("tabindex", "0");
    // AIWROTE
    cv.setAttribute("aria-label", "A trefoil knot, drawn as a tube. Press to pass one crossing through itself.");
    cv.addEventListener("click", pass);
    cv.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pass(); } });
    svg.hidden = true; svg.style.display = "none";   // the stylesheet gives the drawing display: block
    if ("ResizeObserver" in window) new ResizeObserver(redraw).observe(cv);
    redraw();
    fig.addEventListener("pointerenter", startPulse);
    new MutationObserver(function () { pal = palette(); redraw(); }).observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return true;
  }

  window.KnotFig = { mount: mount, config: CFG };
})();
