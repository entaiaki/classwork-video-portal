(function () {
  "use strict";

  /* Work interior — R9 four themes on the R8 narrative.
     The homepage is separate. This file runs on work.html / work-cn.html.
     ?w=class loads the ten group slots. ?w=psych loads the affiliated entry
     and does not invent empty groups. Empty never opens the player.
     Theme, filter, contrast, and work id live in the query. */

  var FLIP_MS = 480;
  var FADE_MS = 240;
  var THEMES = { paper: 1, geometry: 1, stage: 1, editorial: 1 };
  var sheetCss = false;

  var lang = (document.documentElement.getAttribute("data-lang") || "zh").toLowerCase();
  var isZh = lang.indexOf("zh") === 0;

  var I18N = {
    zh: {
      works: "作品",
      eyebrow: "课程作品门户 · Coursework Portal",
      all: "全部",
      playable: "可播放",
      pending: "待提交",
      ready: "可播放",
      empty: "待提交",
      broken: "不可播",
      play: "播放",
      brokenCta: "视频不可用",
      websiteReserve: "网页入口，后续开放",
      scrollHint: "向下滚动，逐组浏览",
      loadFail: "无法加载作品数据（data/works.json）。请用本地 http.server 打开本目录，或检查文件是否存在。",
      videoFailTitle: "视频无法播放",
      videoFailBody: "找不到或无法加载视频文件。请确认 media 路径正确，或改用 python -m http.server 在门户根目录预览。",
      tasteNote: "Taste 试料，门户自备占位（方法论参考 kuaizengji/taste）",
      close: "关闭",
      loadFailTitle: "加载失败",
      railLabel: "跳到",
      prev: "上一组",
      next: "下一组",
      viewWorks: "查看作品",
      reel: "试映条",
      note: "说明",
      groups: "组别",
      sample: "试映",
      affiliated: "挂靠",
      filterEmpty: "此筛选下没有条目"
    },
    en: {
      works: "Works",
      eyebrow: "Coursework Portal · 课程作品门户",
      all: "All",
      playable: "Playable",
      pending: "Pending",
      ready: "Ready",
      empty: "Pending",
      broken: "Unavailable",
      play: "Play",
      brokenCta: "Unavailable",
      websiteReserve: "Website entry, coming later",
      scrollHint: "Scroll to browse each group",
      loadFail: "Could not load data/works.json. Open this folder via a local http.server, or check that the file exists.",
      videoFailTitle: "Video cannot play",
      videoFailBody: "The video file is missing or failed to load. Check the media path, or preview with python -m http.server from the portal root.",
      tasteNote: "Taste sample, portal-generated placeholder (methodology ref: kuaizengji/taste)",
      close: "Close",
      loadFailTitle: "Load failed",
      railLabel: "Jump to",
      prev: "Previous",
      next: "Next",
      viewWorks: "View works",
      reel: "Reel",
      note: "Note",
      groups: "Groups",
      sample: "Sample",
      affiliated: "Affiliated",
      filterEmpty: "Nothing in this filter"
    }
  };
  var t = I18N[isZh ? "zh" : "en"];

  var WORKS = {
    class: { file: "data/works.json", pad: true },
    psych: { file: "data/applied-psychology.json", pad: false }
  };

  var allGroups = [];
  var theme = "paper";
  var filter = "all";
  var contrast = "dark";
  var contrastChosen = false;
  var featuredId = null;
  var workId = "class";

  var PLAY_SVG =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
    '<path d="M3.5 2.2v7.6L10 6 3.5 2.2Z" fill="currentColor"/></svg>';

  function readUrl() {
    var q = new URLSearchParams(location.search);
    var v = (q.get("v") || "paper").toLowerCase();
    theme = THEMES[v] ? v : "paper";
    var w = (q.get("w") || "").toLowerCase();
    workId = !w ? "class" : (WORKS[w] ? w : "");
    var f = (q.get("f") || "all").toLowerCase();
    filter = f === "playable" || f === "pending" ? f : "all";
    var c = (q.get("c") || "").toLowerCase();
    contrastChosen = c === "light" || c === "dark";
    contrast = contrastChosen ? c : "dark";
  }

  function queryString() {
    var p = new URLSearchParams();
    if (workId) p.set("w", workId);
    p.set("v", theme);
    p.set("f", filter);
    if (theme === "editorial") p.set("c", contrast || "dark");
    return p.toString();
  }

  function writeUrl() {
    var next = location.pathname + "?" + queryString();
    if (location.search !== "?" + queryString()) {
      history.replaceState({ v: theme, f: filter, c: contrast }, "", next);
    }
  }

  function applyThemeAttr() {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "editorial") {
      document.documentElement.setAttribute("data-contrast", contrast || "dark");
    }
  }

  function pick(obj, zhKey, enKey) {
    return isZh ? (obj[zhKey] || obj[enKey] || "") : (obj[enKey] || obj[zhKey] || "");
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null && text !== "") node.textContent = text;
    return node;
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function padSlot(n) {
    var s = String(n || "");
    return s.length >= 2 ? "G" + s : "G" + ("0" + s).slice(-2);
  }

  function slotDigits(n) {
    return ("0" + String(n || "")).slice(-2);
  }

  function statusLabel(group) {
    if (group && typeof group === "object") {
      var custom = pick(group, "status_zh", "status_en");
      if (custom) return custom;
      return statusLabel(group.status || "empty");
    }
    var status = group || "empty";
    if (status === "ready") return t.ready;
    if (status === "broken") return t.broken;
    return t.empty;
  }

  function isPlayableStatus(status) {
    return status === "ready" || status === "broken";
  }

  function isDuplicateEmptyTitle(title) {
    if (!title) return true;
    var norm = String(title).trim();
    return (
      norm === t.empty ||
      norm === "待提交" ||
      norm === "Pending submission" ||
      norm === "Pending"
    );
  }

  function countByStatus(groups) {
    var ready = 0, empty = 0, broken = 0;
    (groups || []).forEach(function (g) {
      var s = g.status || "empty";
      if (s === "ready") ready += 1;
      else if (s === "broken") broken += 1;
      else empty += 1;
    });
    return { ready: ready, empty: empty, broken: broken };
  }

  function ensureTenSlots(groups) {
    var bySlot = {};
    (groups || []).forEach(function (g) {
      if (g && g.slot != null) bySlot[Number(g.slot)] = g;
    });
    var out = [];
    for (var i = 1; i <= 10; i++) {
      if (bySlot[i]) out.push(bySlot[i]);
      else {
        out.push({
          id: "g" + String(i).padStart(2, "0"),
          slot: i,
          name_zh: "第 " + i + " 组",
          name_en: "Group " + i,
          title_zh: "待提交",
          title_en: "Pending submission",
          cover: "assets/img/placeholder-cover.svg",
          video: { kind: "file", src: null },
          website_url: null,
          status: "empty"
        });
      }
    }
    return out;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function visibleGroups() {
    return allGroups.filter(function (g) {
      var s = g.status || "empty";
      if (filter === "playable") return isPlayableStatus(s);
      if (filter === "pending") return s === "empty";
      return true;
    });
  }

  function playableVisible() {
    return visibleGroups().filter(function (g) {
      return isPlayableStatus(g.status || "empty");
    });
  }

  function groupById(id) {
    for (var i = 0; i < allGroups.length; i++) {
      if (allGroups[i].id === id) return allGroups[i];
    }
    return null;
  }

  function splitTitleChars(titleEl, text) {
    titleEl.textContent = "";
    titleEl.setAttribute("aria-label", text);
    titleEl.classList.add("has-chars");
    titleEl.classList.remove("reveal-item");
    var chars = Array.from(text);
    chars.forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span");
      inner.className = "char-in";
      inner.style.setProperty("--cd", 80 + i * 48 + "ms");
      inner.textContent = ch === " " ? "\u00a0" : ch;
      span.appendChild(inner);
      titleEl.appendChild(span);
    });
  }

  function renderShellMeta(meta, groups) {
    var course = pick(meta, "course_zh", "course_en");
    setText("course-title", course);
    var courseEl = document.getElementById("course-title");
    if (courseEl) courseEl.setAttribute("title", course);
    setText("hero-eyebrow", course || t.eyebrow);
    document.title = (course || t.works) + (isZh ? " · 课作门户" : " · Classwork");
    setText("scroll-hint-text", workId === "psych"
      ? (isZh ? "向下滚动，查看挂靠条目" : "Scroll to the affiliated entry")
      : t.scrollHint);
    setText("title-echo", t.works);
    setText("note-toggle-label", t.note);
    var unit = pick(meta, "unit_zh", "unit_en") || t.groups;
    setText("band-label", unit);
    var tileZh = document.querySelector(".tile-d .tile-zh");
    var tileEn = document.querySelector(".tile-d .tile-en");
    if (tileZh) tileZh.textContent = meta.unit_zh || (isZh ? "组别" : tileZh.textContent);
    if (tileEn) tileEn.textContent = meta.unit_en || "Groups";
    if (workId === "psych") {
      var entryZh = document.querySelector(".tile-c .tile-zh");
      var entryEn = document.querySelector(".tile-c .tile-en");
      if (entryZh) entryZh.textContent = "条目";
      if (entryEn) entryEn.textContent = "Entry";
    }
    setText("reel-label", t.reel);
    setText("bar-cta", t.viewWorks);
    setText("hero-cta", t.viewWorks);
    setText("showreel-prev", t.prev);
    setText("showreel-next", t.next);
    setText("player-prev", t.prev);
    setText("player-next", t.next);
    setText("showreel-reserve", t.websiteReserve);

    var filters = document.querySelectorAll("#index-filter button");
    for (var fi = 0; fi < filters.length; fi++) {
      var key = filters[fi].getAttribute("data-filter");
      if (t[key]) filters[fi].textContent = t[key];
    }

    var titleEl = document.getElementById("page-title");
    if (titleEl) {
      if (prefersReducedMotion()) titleEl.textContent = t.works;
      else splitTitleChars(titleEl, t.works);
    }

    var metaLine = document.getElementById("meta-line");
    if (metaLine) {
      metaLine.innerHTML = "";
      var term = pick(meta, "term_zh", "term_en");
      var instructor = pick(meta, "instructor_zh", "instructor_en");
      if (term) metaLine.appendChild(el("span", "meta-item", term));
      if (instructor) metaLine.appendChild(el("span", "meta-item", instructor));
    }

    var counts = countByStatus(groups);
    var summary = document.getElementById("work-summary");
    if (summary) {
      summary.innerHTML = "";
      summary.appendChild(el("span", "summary-tag", counts.ready + " " + t.playable));
      if (counts.broken) summary.appendChild(el("span", "summary-tag is-muted", counts.broken + " " + t.broken));
      summary.appendChild(el("span", "summary-tag is-muted", counts.empty + " " + t.pending));
    }
    setText("note-text", pick(meta, "note_zh", "note_en"));
  }

  function buildSection(group, total) {
    var status = group.status || "empty";
    var section = el("article", "work-section is-" + status);
    section.id = "work-" + (group.id || "");
    section.setAttribute("data-id", group.id || "");
    section.setAttribute("data-status", status);

    var ghost = el("span", "section-ghost", slotDigits(group.slot));
    ghost.setAttribute("aria-hidden", "true");
    section.appendChild(ghost);

    var inner = el("div", "section-inner");
    var metaCol = el("div", "section-meta");
    var slot = el("p", "section-slot");
    slot.appendChild(el("span", "slot-code", padSlot(group.slot)));
    slot.appendChild(el("span", "slot-count", slotDigits(group.slot) + " / " + slotDigits(total)));
    var nameText = pick(group, "name_zh", "name_en");
    var name = el("h2", "section-name");
    name.appendChild(el("span", "name-fill", nameText));
    var nameStroke = el("span", "name-stroke", nameText);
    nameStroke.setAttribute("aria-hidden", "true");
    name.appendChild(nameStroke);
    metaCol.appendChild(slot);
    if (group.affiliated) metaCol.appendChild(el("p", "section-affil", t.affiliated));
    metaCol.appendChild(name);

    var title = pick(group, "title_zh", "title_en");
    if (!(status === "empty" && isDuplicateEmptyTitle(title))) {
      metaCol.appendChild(el("p", "section-title", title));
    }
    metaCol.appendChild(el("p", "section-status", statusLabel(group)));

    if (isPlayableStatus(status)) {
      var btn = el("button", "section-play");
      btn.type = "button";
      btn.innerHTML = PLAY_SVG + "<span></span>";
      btn.querySelector("span").textContent = status === "ready" ? t.play : t.brokenCta;
      btn.setAttribute("aria-label", (status === "ready" ? t.play : t.brokenCta) + " " + title);
      btn.addEventListener("click", function () {
        setFeatured(group.id);
        openPlayer(group, btn);
      });
      metaCol.appendChild(btn);
    }

    metaCol.appendChild(el("p", "website-reserve", t.websiteReserve));

    var coverCol = el("div", "section-cover");
    if (isPlayableStatus(status)) {
      var frame = el("button", "cover-frame");
      frame.type = "button";
      frame.setAttribute("aria-label", (status === "ready" ? t.play : t.brokenCta) + " " + title);
      var media = el("span", "cover-media");
      var img = document.createElement("img");
      img.src = group.cover || "assets/img/placeholder-cover.svg";
      img.alt = "";
      img.loading = "lazy";
      media.appendChild(img);
      frame.appendChild(media);
      var hint = el("span", "cover-playhint");
      hint.setAttribute("aria-hidden", "true");
      hint.innerHTML = PLAY_SVG + "<span></span>";
      hint.querySelector("span").textContent = status === "ready" ? t.play : t.brokenCta;
      frame.appendChild(hint);
      frame.addEventListener("click", function () {
        setFeatured(group.id);
        openPlayer(group, frame);
      });
      coverCol.appendChild(frame);
    } else {
      var pending = el("div", "cover-pending");
      pending.appendChild(el("span", "pending-slot", padSlot(group.slot)));
      pending.appendChild(el("span", "pending-label", statusLabel(group)));
      coverCol.appendChild(pending);
    }

    inner.appendChild(metaCol);
    inner.appendChild(coverCol);
    section.appendChild(inner);

    section.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest("button, a")) return;
      setFeatured(group.id);
    });
    return section;
  }

  function renderSections(groups) {
    var track = document.getElementById("works-track");
    if (!track) return;
    track.innerHTML = "";
    (groups || []).forEach(function (g) {
      track.appendChild(buildSection(g, groups.length));
    });
  }

  function renderRail(groups) {
    var rail = document.getElementById("works-rail");
    if (!rail) return;
    rail.innerHTML = "";
    var cursor = el("span", "rail-cursor");
    cursor.setAttribute("aria-hidden", "true");
    rail.appendChild(cursor);
    (groups || []).forEach(function (g) {
      var btn = el("button", "rail-item");
      btn.type = "button";
      btn.setAttribute("data-target", "work-" + (g.id || ""));
      btn.setAttribute("aria-label", t.railLabel + " " + padSlot(g.slot));
      btn.appendChild(el("span", "rail-label", padSlot(g.slot)));
      btn.addEventListener("click", function () {
        var target = document.getElementById("work-" + (g.id || ""));
        if (!target || target.hidden) return;
        setFeatured(g.id);
        target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      });
      rail.appendChild(btn);
    });
  }

  function renderReel() {
    var track = document.getElementById("reel-track");
    if (!track) return;
    track.innerHTML = "";
    visibleGroups().forEach(function (g) {
      var status = g.status || "empty";
      var btn = el("button", "reel-card is-" + status);
      btn.type = "button";
      btn.setAttribute("data-id", g.id || "");
      if (isPlayableStatus(status)) {
        var img = document.createElement("img");
        img.src = g.cover || "assets/img/placeholder-cover.svg";
        img.alt = "";
        btn.appendChild(img);
      } else {
        btn.appendChild(el("span", "reel-fallback", padSlot(g.slot)));
      }
      var reelLabel = padSlot(g.slot) + "  " + pick(g, "name_zh", "name_en");
      if (g.affiliated) reelLabel = t.affiliated + "  " + reelLabel;
      btn.appendChild(el("span", "reel-meta", reelLabel));
      btn.addEventListener("click", function () {
        setFeatured(g.id, { scroll: true });
        if (!isPlayableStatus(status)) return;
        var frame = document.querySelector("#work-" + g.id + " .cover-frame");
        openPlayer(g, frame || btn);
      });
      track.appendChild(btn);
    });
  }

  function fillPlayButton(node, group) {
    if (!node || !group) return;
    var status = group.status || "empty";
    node.innerHTML = PLAY_SVG + "<span></span>";
    node.querySelector("span").textContent = status === "ready" ? t.play : t.brokenCta;
    node.setAttribute("data-id", group.id || "");
  }

  function renderShowreel() {
    var group = groupById(featuredId);
    var affil = document.getElementById("showreel-affil");
    if (!group) {
      setText("showreel-kicker", "");
      setText("showreel-title", t.filterEmpty);
      setText("showreel-sub", "");
      setText("showreel-status", "");
      if (affil) affil.hidden = true;
      setText("showreel-reserve", "");
      var playGone = document.getElementById("showreel-play");
      var ctaGone = document.getElementById("showreel-cta");
      var emptyGone = document.getElementById("showreel-empty");
      if (playGone) playGone.hidden = true;
      if (ctaGone) ctaGone.hidden = true;
      if (emptyGone) emptyGone.hidden = true;
      return;
    }
    var status = group.status || "empty";
    var playable = isPlayableStatus(status);
    var title = pick(group, "title_zh", "title_en");
    setText("showreel-kicker", "#" + slotDigits(group.slot));
    setText("showreel-title", title);
    setText("showreel-sub", pick(group, "name_zh", "name_en"));
    setText("showreel-status", statusLabel(group));
    if (affil) {
      affil.hidden = !group.affiliated;
      affil.textContent = t.affiliated;
    }
    setText("showreel-reserve", t.websiteReserve);
    var img = document.getElementById("showreel-img");
    if (img) {
      img.src = group.cover || "assets/img/placeholder-cover.svg";
      img.alt = "";
    }
    var playBtn = document.getElementById("showreel-play");
    var cta = document.getElementById("showreel-cta");
    var empty = document.getElementById("showreel-empty");
    if (playBtn) {
      playBtn.hidden = !playable;
      playBtn.setAttribute("data-id", group.id || "");
      playBtn.setAttribute("aria-label", (status === "ready" ? t.play : t.brokenCta) + " " + title);
    }
    if (cta) {
      cta.hidden = !playable;
      fillPlayButton(cta, group);
      cta.setAttribute("aria-label", (status === "ready" ? t.play : t.brokenCta) + " " + title);
    }
    var hint = document.getElementById("showreel-hint");
    if (hint) {
      hint.innerHTML = PLAY_SVG + "<span></span>";
      var hintText = hint.querySelector("span");
      if (hintText) hintText.textContent = status === "ready" ? t.play : t.brokenCta;
    }
    if (empty) {
      empty.hidden = playable;
      setText("showreel-empty-slot", padSlot(group.slot));
      setText("showreel-empty-label", statusLabel(group));
    }
  }

  function markFeatured() {
    var sections = document.querySelectorAll(".work-section");
    for (var i = 0; i < sections.length; i++) {
      var on = sections[i].getAttribute("data-id") === featuredId;
      sections[i].classList.toggle("is-featured", on);
      if (on) sections[i].setAttribute("aria-current", "true");
      else sections[i].removeAttribute("aria-current");
    }
  }

  function markEnds() {
    var nodes = [];
    var sections = document.querySelectorAll(".work-section");
    for (var i = 0; i < sections.length; i++) {
      sections[i].classList.remove("is-first-visible", "is-last-visible");
      if (!sections[i].hidden) nodes.push(sections[i]);
    }
    if (nodes.length) {
      nodes[0].classList.add("is-first-visible");
      nodes[nodes.length - 1].classList.add("is-last-visible");
    }
  }

  function updatePagers() {
    var many = visibleGroups().length > 1;
    var manyPlay = playableVisible().length > 1;
    var a = document.getElementById("showreel-prev");
    var b = document.getElementById("showreel-next");
    var c = document.getElementById("player-prev");
    var d = document.getElementById("player-next");
    if (a) a.disabled = !many;
    if (b) b.disabled = !many;
    if (c) c.disabled = !manyPlay;
    if (d) d.disabled = !manyPlay;
  }

  function setFeatured(id, opts) {
    opts = opts || {};
    var vis = visibleGroups();
    var allowed = false;
    for (var i = 0; i < vis.length; i++) if (vis[i].id === id) allowed = true;
    if (!allowed) {
      var playable = playableVisible();
      id = (playable[0] || vis[0] || {}).id || null;
    }
    featuredId = id;
    renderShowreel();
    markFeatured();
    updatePagers();
    if (opts.scroll && featuredId) {
      var node = document.getElementById("work-" + featuredId);
      if (node && !node.hidden) {
        node.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      }
    }
  }

  function stepFeatured(dir, playableOnly) {
    var list = playableOnly ? playableVisible() : visibleGroups();
    if (list.length < 2) return null;
    var idx = 0;
    for (var i = 0; i < list.length; i++) if (list[i].id === featuredId) idx = i;
    var next = list[(idx + dir + list.length) % list.length];
    setFeatured(next.id);
    return next;
  }

  function applyFilter() {
    var visible = {};
    visibleGroups().forEach(function (g) { visible[g.id] = 1; });
    var sections = document.querySelectorAll(".work-section");
    for (var i = 0; i < sections.length; i++) {
      sections[i].hidden = !visible[sections[i].getAttribute("data-id")];
    }
    var items = document.querySelectorAll(".rail-item");
    for (var j = 0; j < items.length; j++) {
      var target = items[j].getAttribute("data-target") || "";
      items[j].hidden = !visible[target.replace(/^work-/, "")];
    }
    markEnds();
    var trackEmpty = document.getElementById("works-track");
    if (trackEmpty) {
      var oldEmpty = trackEmpty.querySelector(".filter-empty");
      if (oldEmpty) oldEmpty.remove();
      if (!visibleGroups().length) {
        trackEmpty.appendChild(el("p", "filter-empty", t.filterEmpty));
      }
    }
    if (!visible[featuredId]) {
      var playable = playableVisible();
      var vis = visibleGroups();
      featuredId = (playable[0] || vis[0] || {}).id || null;
    }
    renderShowreel();
    renderReel();
    markFeatured();
    updatePagers();
    var visCount = visibleGroups().length;
    setText("counter-total", visCount < 1 ? "00" : slotDigits(visCount));
    revealInView();
  }

  function syncLinks() {
    var q = queryString();
    var links = document.querySelectorAll(".version-switch a");
    for (var i = 0; i < links.length; i++) {
      var v = links[i].getAttribute("data-v");
      var params = new URLSearchParams(q);
      params.set("v", v);
      if (v !== "editorial") params.delete("c");
      links[i].setAttribute("href", "?" + params.toString());
      if (v === theme) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
    var langs = document.querySelectorAll("[data-lang-target]");
    for (var k = 0; k < langs.length; k++) {
      var page = langs[k].getAttribute("data-lang-target") === "en" ? "work.html" : "work-cn.html";
      langs[k].setAttribute("href", page + "?" + q);
    }
    var homes = document.querySelectorAll(".home-link");
    var homePage = isZh ? "index-cn.html" : "index.html";
    var hp = new URLSearchParams();
    hp.set("v", theme);
    if (theme === "editorial") hp.set("c", contrast || "dark");
    var homeHref = homePage + "?" + hp.toString();
    for (var h = 0; h < homes.length; h++) homes[h].setAttribute("href", homeHref);
    var filters = document.querySelectorAll("#index-filter button");
    for (var f = 0; f < filters.length; f++) {
      filters[f].setAttribute("aria-pressed", filters[f].getAttribute("data-filter") === filter ? "true" : "false");
    }
    var tiles = document.querySelectorAll(".paper-tile[data-filter]");
    for (var n = 0; n < tiles.length; n++) {
      tiles[n].setAttribute("aria-pressed", tiles[n].getAttribute("data-filter") === filter ? "true" : "false");
    }
    var contrasts = document.querySelectorAll("#contrast-switch button");
    for (var c = 0; c < contrasts.length; c++) {
      contrasts[c].setAttribute("aria-pressed", contrasts[c].getAttribute("data-c") === contrast ? "true" : "false");
    }
  }

  function setFilter(next) {
    if (next !== "playable" && next !== "pending") next = "all";
    filter = next;
    applyFilter();
    writeUrl();
    syncLinks();
  }

  function setTheme(next) {
    if (!THEMES[next] || next === theme) {
      theme = THEMES[next] ? next : theme;
      writeUrl();
      syncLinks();
      return;
    }
    theme = next;
    if (theme === "editorial" && !contrastChosen) contrast = "dark";
    applyThemeAttr();
    writeUrl();
    syncLinks();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function setContrast(next) {
    contrastChosen = true;
    contrast = next === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-contrast", contrast);
    writeUrl();
    syncLinks();
  }

  function moveRailCursor(index) {
    var rail = document.getElementById("works-rail");
    if (!rail) return;
    var cursor = rail.querySelector(".rail-cursor");
    var items = [];
    var all = rail.querySelectorAll(".rail-item");
    for (var i = 0; i < all.length; i++) if (!all[i].hidden) items.push(all[i]);
    if (!cursor) return;
    if (index < 0 || !items[index]) {
      cursor.classList.remove("is-on");
      return;
    }
    var item = items[index];
    var y = item.offsetTop + item.offsetHeight / 2;
    cursor.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    cursor.classList.add("is-on");
  }

  var counterState = { n: 1, timer: 0 };

  function setCounter(n) {
    var holder = document.getElementById("counter-current");
    if (!holder) return;
    var label = slotDigits(n);
    if (!holder.classList.contains("counter-viewport")) {
      var initial = holder.textContent || label;
      holder.textContent = "";
      holder.classList.add("counter-viewport");
      holder.appendChild(el("span", "counter-digit", initial));
    }
    var current = holder.querySelector(".counter-digit:last-child");
    if (current && current.textContent === label && holder.childElementCount === 1) {
      counterState.n = n;
      return;
    }
    var prev = counterState.n;
    counterState.n = n;
    if (prefersReducedMotion() || Math.abs(n - prev) !== 1) {
      holder.textContent = "";
      holder.appendChild(el("span", "counter-digit", label));
      return;
    }
    var dir = n > prev ? "dir-down" : "dir-up";
    var oldDigits = holder.querySelectorAll(".counter-digit");
    var old = oldDigits[oldDigits.length - 1];
    var next = el("span", "counter-digit is-next " + dir, label);
    holder.appendChild(next);
    if (old) old.classList.add("is-out", dir);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        next.classList.remove("is-next");
        next.classList.add("is-in");
      });
    });
    clearTimeout(counterState.timer);
    counterState.timer = setTimeout(function () {
      if (counterState.n !== n) return;
      holder.textContent = "";
      holder.appendChild(el("span", "counter-digit", label));
    }, 460);
  }

  function revealInView() {
    var sections = document.querySelectorAll(".work-section");
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].hidden) continue;
      var r = sections[i].getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) sections[i].classList.add("is-visible");
    }
  }

  function wireReveal() {
    var hero = document.getElementById("hero");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      if (hero) hero.classList.add("is-visible");
      var all = document.querySelectorAll(".work-section");
      for (var i = 0; i < all.length; i++) all[i].classList.add("is-visible");
      return;
    }
    var sections = Array.prototype.slice.call(document.querySelectorAll(".work-section"));
    function revealUpTo(idx) {
      for (var i = 0; i <= idx; i++) {
        if (!sections[i].classList.contains("is-visible")) sections[i].classList.add("is-visible");
        io.unobserve(sections[i]);
      }
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) revealUpTo(sections.indexOf(entry.target));
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    sections.forEach(function (s) { io.observe(s); });
    if (hero) {
      var showHero = function () { hero.classList.add("is-visible"); };
      requestAnimationFrame(function () { requestAnimationFrame(showHero); });
      setTimeout(showHero, 400);
    }
  }

  function wireScroll() {
    var bar = document.getElementById("site-bar");
    var progress = document.getElementById("scroll-progress");
    var hero = document.getElementById("hero");
    var track = document.getElementById("works-track");
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || 0;
      if (bar) bar.classList.toggle("is-scrolled", y > 28);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, y / max) : 0;
        progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      }
      if (hero && !prefersReducedMotion()) {
        var heroH = hero.offsetHeight || 1;
        var heroP = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / heroH));
        hero.style.setProperty("--hero-p", heroP.toFixed(4));
        document.documentElement.style.setProperty("--hero-p", heroP.toFixed(4));
      }
      if (track && !prefersReducedMotion()) {
        var rect = track.getBoundingClientRect();
        var start = window.innerHeight * 0.75;
        var total = track.offsetHeight + window.innerHeight * 0.2;
        var draw = total > 0 ? (start - rect.top) / total : 0;
        if (draw < 0) draw = 0;
        if (draw > 1) draw = 1;
        track.style.setProperty("--draw", draw.toFixed(4));
      }

      var sections = document.querySelectorAll(".work-section");
      var mid = window.innerHeight * 0.46;
      var activeId = null;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].hidden) continue;
        var r = sections[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          activeId = sections[i].id;
          break;
        }
        if (r.top < mid) activeId = sections[i].id;
      }
      var seen = 0;
      var activeIdx = -1;
      for (var n = 0; n < sections.length; n++) {
        if (sections[n].hidden) {
          sections[n].classList.remove("is-current");
          continue;
        }
        var on = sections[n].id === activeId;
        sections[n].classList.toggle("is-current", on);
        if (on) activeIdx = seen;
        seen += 1;
      }
      var items = document.querySelectorAll(".rail-item");
      for (var j = 0; j < items.length; j++) {
        var railOn = items[j].getAttribute("data-target") === activeId;
        items[j].classList.toggle("is-active", railOn);
        if (railOn) items[j].setAttribute("aria-current", "true");
        else items[j].removeAttribute("aria-current");
      }
      setCounter(activeIdx >= 0 ? activeIdx + 1 : 1);
      moveRailCursor(activeIdx);

      if (!sheetCss && !prefersReducedMotion()) {
        var viewH = window.innerHeight || 1;
        for (var k = 0; k < sections.length; k++) {
          var box = sections[k].getBoundingClientRect();
          var span = box.height + viewH;
          var sheet = span > 0 ? (viewH - box.top) / span : 0.5;
          if (sheet < 0) sheet = 0;
          else if (sheet > 1) sheet = 1;
          var lock = 1 - Math.abs(sheet - 0.5) * 2;
          if (lock < 0) lock = 0;
          sections[k].style.setProperty("--sheet", sheet.toFixed(4));
          sections[k].style.setProperty("--lock", lock.toFixed(4));
        }
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function wireReel() {
    var scroller = document.getElementById("reel-track");
    var bar = document.getElementById("reel-bar");
    if (!scroller || !bar) return;
    var paint = function () {
      var max = scroller.scrollWidth - scroller.clientWidth;
      var ratio = max > 0 ? scroller.scrollLeft / max : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    };
    scroller.addEventListener("scroll", paint, { passive: true });
    paint();
  }

  /* ── Player ── */
  var modal, videoEl, failEl, titleEl, subEl;
  var lastTrigger = null;
  var closeTimer = null;

  function cacheModal() {
    modal = document.getElementById("player-modal");
    videoEl = document.getElementById("player-video");
    failEl = document.getElementById("player-fail");
    titleEl = document.getElementById("player-title");
    subEl = document.getElementById("player-sub");
  }

  function showFail(detail) {
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
      videoEl.hidden = true;
    }
    if (failEl) {
      failEl.innerHTML = "";
      failEl.appendChild(el("strong", null, t.videoFailTitle));
      failEl.appendChild(el("p", null, detail || t.videoFailBody));
      failEl.hidden = false;
    }
  }

  function showVideo(src) {
    if (failEl) failEl.hidden = true;
    if (!videoEl) return;
    videoEl.hidden = false;
    videoEl.src = src;
    videoEl.load();
    var playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () { /* controls remain */ });
    }
  }

  function panelEl() {
    return modal ? modal.querySelector(".modal-panel") : null;
  }

  function clearPanelMotion() {
    var panel = panelEl();
    if (!panel) return;
    panel.style.transition = "";
    panel.style.transform = "";
    panel.style.opacity = "";
  }

  function coverTrigger(node) {
    return !!(node && node.classList && node.classList.contains("cover-frame") && node.isConnected);
  }

  function invertToward(panelRect, targetRect) {
    var scale = targetRect.width / panelRect.width;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    var dx = (targetRect.left + targetRect.width / 2) - (panelRect.left + panelRect.width / 2);
    var dy = (targetRect.top + targetRect.height / 2) - (panelRect.top + panelRect.height / 2);
    return "translate3d(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px,0) scale(" + scale.toFixed(4) + ")";
  }

  function playFlipOpen(trigger) {
    if (prefersReducedMotion() || !coverTrigger(trigger)) return false;
    var panel = panelEl();
    if (!panel) return false;
    var first = trigger.getBoundingClientRect();
    if (first.width < 8) return false;
    panel.style.transition = "none";
    panel.style.transform = "none";
    panel.style.opacity = "1";
    void panel.offsetWidth;
    var last = panel.getBoundingClientRect();
    if (last.width < 8) return false;
    panel.style.transform = invertToward(last, first);
    void panel.offsetWidth;
    panel.style.transition = "transform " + FLIP_MS + "ms var(--ease-out)";
    panel.style.transform = "none";
    panel.style.opacity = "";
    return true;
  }

  function playFlipClose(trigger) {
    if (prefersReducedMotion() || !coverTrigger(trigger)) return false;
    var panel = panelEl();
    if (!panel) return false;
    var target = trigger.getBoundingClientRect();
    if (target.width < 8 || target.bottom < -40 || target.top > window.innerHeight + 40) return false;
    panel.style.transition = "none";
    panel.style.transform = "none";
    panel.style.opacity = "1";
    void panel.offsetWidth;
    var last = panel.getBoundingClientRect();
    if (last.width < 8) return false;
    panel.style.transition = "transform " + FLIP_MS + "ms var(--ease-out), opacity " + FLIP_MS + "ms ease";
    panel.style.transform = invertToward(last, target);
    panel.style.opacity = "0";
    return true;
  }

  function loadIntoModal(group) {
    cacheModal();
    var status = group.status || "empty";
    if (!isPlayableStatus(status)) return;
    if (titleEl) titleEl.textContent = pick(group, "title_zh", "title_en");
    setText("player-kicker", "#" + slotDigits(group.slot));
    if (subEl) {
      var subBits = [pick(group, "name_zh", "name_en")];
      if (group.id === "g01" || /taste|试料/i.test(pick(group, "name_zh", "name_en") + pick(group, "title_zh", "title_en"))) {
        subBits.push(t.tasteNote);
      }
      subEl.textContent = subBits.join(isZh ? "，" : ", ");
    }
    if (failEl) {
      failEl.hidden = true;
      failEl.innerHTML = "";
    }
    if (videoEl) {
      try { videoEl.pause(); } catch (e) { /* ignore */ }
      videoEl.hidden = true;
      videoEl.removeAttribute("src");
      videoEl.onerror = function () { showFail(t.videoFailBody); };
    }
    var src = group.video && group.video.src;
    if (!src) {
      showFail(t.videoFailBody);
      return;
    }
    if (group.video.kind === "file" || !/^https?:/i.test(src)) {
      fetch(src, { method: "HEAD" })
        .then(function (res) {
          if (!res.ok) { showFail(t.videoFailBody + " (HTTP " + res.status + ")"); return; }
          showVideo(src);
        })
        .catch(function () {
          fetch(src, { method: "GET", headers: { Range: "bytes=0-1" } })
            .then(function (res) {
              if (!res.ok) { showFail(t.videoFailBody + " (HTTP " + res.status + ")"); return; }
              showVideo(src);
            })
            .catch(function () { showFail(t.videoFailBody); });
        });
    } else {
      showVideo(src);
    }
  }

  function openPlayer(group, triggerEl) {
    cacheModal();
    if (!modal) return;
    var status = group.status || "empty";
    if (status === "empty" || !isPlayableStatus(status)) return;
    if (modal.classList.contains("is-closing")) return;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (modal.classList.contains("is-open")) {
      lastTrigger = triggerEl || lastTrigger;
      loadIntoModal(group);
      return;
    }
    lastTrigger = triggerEl || document.activeElement;
    loadIntoModal(group);
    modal.hidden = false;
    modal.classList.remove("is-closing");
    clearPanelMotion();
    document.body.classList.add("is-modal-open");
    void modal.offsetWidth;
    modal.classList.add("is-open");
    playFlipOpen(lastTrigger);
    var closeBtn = document.getElementById("player-close");
    if (closeBtn) closeBtn.focus();
  }

  function finishClose() {
    cacheModal();
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove("is-open");
    modal.classList.remove("is-closing");
    modal.classList.remove("is-flip");
    clearPanelMotion();
    document.body.classList.remove("is-modal-open");
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
      videoEl.hidden = true;
      videoEl.onerror = null;
    }
    if (failEl) {
      failEl.hidden = true;
      failEl.innerHTML = "";
    }
    var restore = lastTrigger;
    lastTrigger = null;
    closeTimer = null;
    if (restore && typeof restore.focus === "function") {
      try { restore.focus(); } catch (e) { /* ignore */ }
    }
  }

  function closePlayer() {
    cacheModal();
    if (!modal || modal.hidden) return;
    if (modal.classList.contains("is-closing")) return;
    modal.classList.add("is-closing");
    if (videoEl) {
      try { videoEl.pause(); } catch (e) { /* ignore */ }
    }
    if (prefersReducedMotion()) {
      finishClose();
      return;
    }
    var flipped = playFlipClose(lastTrigger);
    if (flipped) modal.classList.add("is-flip");
    else clearPanelMotion();
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(finishClose, flipped ? FLIP_MS + 40 : FADE_MS);
  }

  function wireModal() {
    cacheModal();
    var closeBtn = document.getElementById("player-close");
    var backdrop = document.getElementById("player-backdrop");
    if (closeBtn) closeBtn.addEventListener("click", closePlayer);
    if (backdrop) backdrop.addEventListener("click", closePlayer);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modal && !modal.hidden) {
        ev.preventDefault();
        closePlayer();
      }
    });
    var prev = document.getElementById("player-prev");
    var next = document.getElementById("player-next");
    if (prev) prev.addEventListener("click", function () {
      var g = stepFeatured(-1, true);
      if (g) loadIntoModal(g);
    });
    if (next) next.addEventListener("click", function () {
      var g = stepFeatured(1, true);
      if (g) loadIntoModal(g);
    });
  }

  function showLoadError(msg) {
    var track = document.getElementById("works-track");
    if (!track) return;
    var box = el("div", "fail-box");
    box.style.margin = "48px auto";
    box.style.maxWidth = "42rem";
    box.appendChild(el("strong", null, t.loadFailTitle));
    box.appendChild(el("p", null, msg || t.loadFail));
    track.appendChild(box);
    var hero = document.getElementById("hero");
    if (hero) hero.classList.add("is-visible");
  }

  function wirePointer() {
    if (prefersReducedMotion()) return;
    var fine = !(window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches);
    var cover = null;
    var hold = null;
    var btn = null;
    var card = null;
    var mx = 0, my = 0, cx = 0, cy = 0, raf = 0;

    function writeInertia(node) {
      if (!node) return;
      node.style.setProperty("--ix", cx.toFixed(4));
      node.style.setProperty("--iy", cy.toFixed(4));
    }
    function tick() {
      raf = 0;
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      writeInertia(cover || hold);
      var settled = Math.abs(mx - cx) <= 0.004 && Math.abs(my - cy) <= 0.004;
      if (!settled) raf = requestAnimationFrame(tick);
      else if (!cover && hold) {
        hold.style.removeProperty("--ix");
        hold.style.removeProperty("--iy");
        hold = null;
      }
    }
    function ensure() { if (!raf) raf = requestAnimationFrame(tick); }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var nx = (e.clientX / (window.innerWidth || 1)) * 2 - 1;
      var ny = (e.clientY / (window.innerHeight || 1)) * 2 - 1;
      document.documentElement.style.setProperty("--mx", nx.toFixed(3));
      document.documentElement.style.setProperty("--my", ny.toFixed(3));
      if (!fine) return;

      var nextCover = e.target && e.target.closest ? e.target.closest(".cover-frame") : null;
      var nextBtn = e.target && e.target.closest ? e.target.closest(".section-play") : null;
      var nextCard = null;
      if (theme === "editorial" && e.target && e.target.closest) {
        nextCard = e.target.closest(".work-section") || e.target.closest(".showreel-stage");
      }
      if (cover && cover !== nextCover) {
        if (!nextCover) {
          hold = cover;
          mx = 0;
          my = 0;
        } else {
          cover.style.removeProperty("--ix");
          cover.style.removeProperty("--iy");
          cx = 0;
          cy = 0;
          hold = null;
        }
      }
      if (btn && btn !== nextBtn) {
        btn.style.removeProperty("--bx");
        btn.style.removeProperty("--by");
      }
      if (card && card !== nextCard) {
        card.style.removeProperty("--tx");
        card.style.removeProperty("--ty");
      }
      cover = nextCover;
      btn = nextBtn;
      card = nextCard;
      if (cover) {
        hold = null;
        var rect = cover.getBoundingClientRect();
        mx = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
        my = ((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1;
      }
      if (btn) {
        var b = btn.getBoundingClientRect();
        var bx = (e.clientX - (b.left + b.width / 2)) / ((b.width || 1) / 2);
        var by = (e.clientY - (b.top + b.height / 2)) / ((b.height || 1) / 2);
        if (bx > 1) bx = 1;
        if (bx < -1) bx = -1;
        if (by > 1) by = 1;
        if (by < -1) by = -1;
        btn.style.setProperty("--bx", bx.toFixed(3));
        btn.style.setProperty("--by", by.toFixed(3));
      }
      if (card) {
        var cr = card.getBoundingClientRect();
        card.style.setProperty("--tx", (((e.clientX - cr.left) / (cr.width || 1)) * 2 - 1).toFixed(3));
        card.style.setProperty("--ty", (((e.clientY - cr.top) / (cr.height || 1)) * 2 - 1).toFixed(3));
      }
      ensure();
    }, { passive: true });
  }

  function wireChrome() {
    var links = document.querySelectorAll(".version-switch a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
        ev.preventDefault();
        setTheme(this.getAttribute("data-v"));
      });
    }
    var filters = document.querySelectorAll("#index-filter button");
    for (var f = 0; f < filters.length; f++) {
      filters[f].addEventListener("click", function () {
        setFilter(this.getAttribute("data-filter"));
      });
    }
    var tiles = document.querySelectorAll(".paper-tile");
    for (var n = 0; n < tiles.length; n++) {
      tiles[n].addEventListener("click", function () {
        var go = this.getAttribute("data-go");
        var fkey = this.getAttribute("data-filter");
        if (go === "showreel") {
          setFilter("all");
          var visNow = visibleGroups();
          var firstId = null;
          for (var gi = 0; gi < visNow.length; gi++) {
            if (isPlayableStatus(visNow[gi].status || "empty")) { firstId = visNow[gi].id; break; }
          }
          if (!firstId && visNow[0]) firstId = visNow[0].id;
          if (firstId) setFeatured(firstId);
          var reel = document.getElementById("showreel");
          if (reel) reel.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
          return;
        }
        if (fkey) setFilter(fkey);
        var dest = go === "works" || fkey ? document.getElementById("works-band") : null;
        if (dest) dest.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      });
    }
    var contrasts = document.querySelectorAll("#contrast-switch button");
    for (var c = 0; c < contrasts.length; c++) {
      contrasts[c].addEventListener("click", function () {
        setContrast(this.getAttribute("data-c"));
      });
    }
    var noteBtn = document.getElementById("note-toggle");
    if (noteBtn) {
      noteBtn.addEventListener("click", function () {
        var block = document.getElementById("note-block");
        if (!block) return;
        var open = !block.classList.contains("is-open");
        block.classList.toggle("is-open", open);
        noteBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    var sPrev = document.getElementById("showreel-prev");
    var sNext = document.getElementById("showreel-next");
    if (sPrev) sPrev.addEventListener("click", function () { stepFeatured(-1, false); });
    if (sNext) sNext.addEventListener("click", function () { stepFeatured(1, false); });
    var sPlay = document.getElementById("showreel-play");
    var sCta = document.getElementById("showreel-cta");
    function playFeatured(trigger) {
      var g = groupById(featuredId);
      if (!g || !isPlayableStatus(g.status || "empty")) return;
      openPlayer(g, trigger);
    }
    if (sPlay) sPlay.addEventListener("click", function () { playFeatured(sPlay); });
    if (sCta) sCta.addEventListener("click", function () { playFeatured(sPlay || sCta); });
    window.addEventListener("popstate", function () {
      readUrl();
      applyThemeAttr();
      applyFilter();
      syncLinks();
    });
  }

  function boot() {
    readUrl();
    applyThemeAttr();
    if (!prefersReducedMotion()) {
      document.body.classList.add("js-reveal");
      sheetCss = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
      if (sheetCss) document.documentElement.classList.add("sheet-css");
      else document.documentElement.classList.add("sheet-js");
    }
    wireModal();
    wireChrome();
    wireReel();
    syncLinks();
    var closeBtn = document.getElementById("player-close");
    if (closeBtn) closeBtn.setAttribute("aria-label", t.close);

    if (!WORKS[workId]) {
      showLoadError(isZh ? "没有这件作品。请从门户重新进入。" : "This work does not exist. Return to the portal and choose a work.");
      return;
    }
    document.documentElement.setAttribute("data-work", workId);
    fetch(WORKS[workId].file, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var groups = data.groups || [];
        allGroups = WORKS[workId].pad ? ensureTenSlots(groups) : groups.slice();
        renderShellMeta(data.meta || {}, allGroups);
        renderSections(allGroups);
        renderRail(allGroups);
        var firstPlay = null;
        for (var i = 0; i < allGroups.length; i++) {
          if (isPlayableStatus(allGroups[i].status || "empty")) { firstPlay = allGroups[i].id; break; }
        }
        featuredId = firstPlay || (allGroups[0] && allGroups[0].id);
        applyFilter();
        wireReveal();
        wireScroll();
        wirePointer();
      })
      .catch(function (err) {
        showLoadError(t.loadFail + (err && err.message ? " [" + err.message + "]" : ""));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
