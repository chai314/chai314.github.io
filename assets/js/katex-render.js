/* Overrides Blowfish's assets/js/katex-render.js.
   Hugo's typographer turns ' into a curly ’ everywhere, maths included, so T' reached KaTeX
   as T’ and the prime did not render. The macros turn curly quotes back into what LaTeX means
   by them inside maths: ’ is a prime, ‘ is a backtick. */
document.getElementById("katex-render") &&
  document.getElementById("katex-render").addEventListener("load", () => {
    renderMathInElement(document.body, {
      macros: { "’": "'", "‘": "`" },
      throwOnError: false
    });
  });
