(function () {
  "use strict";

  var THEMES = {
    paper: { zh: "纸面", en: "Paper" },
    geometry: { zh: "几何", en: "Geometry" },
    stage: { zh: "舞台", en: "Stage" },
    editorial: { zh: "编辑", en: "Editorial" }
  };
  var isZh = (document.documentElement.lang || "").toLowerCase().indexOf("zh") === 0;
  document.documentElement.classList.add("js");

  function read() {
    var q = new URLSearchParams(location.search);
    var v = (q.get("v") || "").toLowerCase();
    if (!THEMES[v]) v = "";
    var c = (q.get("c") || "").toLowerCase();
    if (c !== "light" && c !== "dark") c = "";
    return { v: v, c: c };
  }

  function carriedTheme() {
    var s = read();
    return { v: s.v || "paper", c: s.c };
  }

  function withTheme(page, extra) {
    var s = carriedTheme();
    var p = new URLSearchParams();
    if (extra) {
      Object.keys(extra).forEach(function (key) { p.set(key, extra[key]); });
    }
    p.set("v", s.v);
    if (s.v === "editorial") p.set("c", s.c || "dark");
    return page + "?" + p.toString();
  }

  function sync() {
    var works = document.querySelectorAll("[data-work]");
    for (var i = 0; i < works.length; i++) {
      var id = works[i].getAttribute("data-work");
      var page = isZh ? "work-cn.html" : "work.html";
      works[i].setAttribute("href", withTheme(page, { w: id }));
    }
    var langs = document.querySelectorAll("[data-lang-target]");
    for (var k = 0; k < langs.length; k++) {
      var target = langs[k].getAttribute("data-lang-target") === "en" ? "index.html" : "index-cn.html";
      langs[k].setAttribute("href", withTheme(target));
    }
    var mark = document.querySelector(".mark");
    if (mark) mark.setAttribute("href", withTheme(isZh ? "index-cn.html" : "index.html"));

    var carry = document.getElementById("theme-carry");
    var state = read();
    if (!carry) return;
    if (!state.v) {
      carry.hidden = true;
      return;
    }
    carry.hidden = false;
    var name = isZh ? THEMES[state.v].zh : THEMES[state.v].en;
    if (state.v === "editorial") {
      var light = state.c === "light";
      name += light ? (isZh ? " · 纸" : " · Paper") : (isZh ? " · 墨" : " · Ink");
    }
    carry.textContent = name;
    carry.setAttribute("title", isZh ? "进入作品时沿用此主题" : "This theme carries into a work");
  }

  function onScroll() {
    var bar = document.getElementById("bar");
    var field = document.getElementById("field");
    var progress = document.getElementById("bar-progress");
    if (bar && field) {
      var leaving = field.getBoundingClientRect().bottom <= (bar.offsetHeight || 68) + 1;
      bar.classList.toggle("is-paper", leaving);
    }
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, (window.scrollY || 0) / max) : 0;
      progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }
  }

  function wireReveal() {
    var nodes = document.querySelectorAll(".sheet-intro, .chapter, .ledger");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      for (var i = 0; i < nodes.length; i++) nodes[i].classList.add("is-in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
    for (var n = 0; n < nodes.length; n++) io.observe(nodes[n]);
  }

  sync();
  wireReveal();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("popstate", sync);
})();
