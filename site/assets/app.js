(function () {
  "use strict";

  var m = window.JLPT_MANIFEST;
  if (!m) return;

  document.getElementById("site-title").textContent = m.site.title;
  document.getElementById("site-subtitle").textContent = m.site.subtitle || "";
  document.title = m.site.title;

  var catalog = document.getElementById("catalog");
  var emptyMsg = document.getElementById("empty");

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function lessonCard(cat, lesson) {
    var a = el("a", "card");
    a.href = "/" + lesson.path;
    var tags = (lesson.tags || []).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
    a.innerHTML =
      '<div class="card-title">' + esc(lesson.title) + "</div>" +
      (lesson.desc ? '<div class="card-desc">' + esc(lesson.desc) + "</div>" : "") +
      (tags ? '<div class="card-tags">' + tags + "</div>" : "");
    a.dataset.search = [
      lesson.title, lesson.desc, (lesson.tags || []).join(" "), cat.title, cat.desc,
    ].join(" ").toLowerCase();
    return a;
  }

  m.categories.forEach(function (cat) {
    if (!cat.lessons || !cat.lessons.length) return;
    var section = el("section", "category");
    section.dataset.cat = cat.id;

    var head = el("div", "category-head");
    head.innerHTML =
      '<h2 class="category-title">' + esc(cat.title) + "</h2>" +
      (cat.desc ? '<span class="category-desc">' + esc(cat.desc) + "</span>" : "");
    section.appendChild(head);

    var grid = el("div", "grid");
    cat.lessons.forEach(function (lesson) {
      grid.appendChild(lessonCard(cat, lesson));
    });
    section.appendChild(grid);
    catalog.appendChild(section);
  });

  // live search
  var search = document.getElementById("search");
  search.addEventListener("input", function () {
    var q = search.value.trim().toLowerCase();
    var anyVisible = false;

    catalog.querySelectorAll(".category").forEach(function (section) {
      var shown = 0;
      section.querySelectorAll(".card").forEach(function (card) {
        var hit = !q || card.dataset.search.indexOf(q) !== -1;
        card.hidden = !hit;
        if (hit) shown++;
      });
      section.hidden = shown === 0;
      if (shown) anyVisible = true;
    });

    emptyMsg.hidden = anyVisible;
  });
})();
