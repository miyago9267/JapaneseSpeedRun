// Injects a "back to home" bar at the top of every note page.
// A note opts in with:
//   <link rel="stylesheet" href="/assets/note.css">
//   <script src="/assets/note.js" defer></script>
(function () {
  "use strict";
  var titleEl = document.querySelector("title");
  var crumb = (titleEl ? titleEl.textContent : "").trim();

  var bar = document.createElement("header");
  bar.className = "jlpt-bar";

  var home = document.createElement("a");
  home.className = "jlpt-home";
  home.href = "/";
  home.textContent = "← 日文筆記";
  bar.appendChild(home);

  if (crumb) {
    var span = document.createElement("span");
    span.className = "jlpt-crumb";
    span.textContent = crumb;
    bar.appendChild(span);
  }

  document.body.insertBefore(bar, document.body.firstChild);
})();
