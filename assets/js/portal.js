(function () {
  "use strict";

  /* CW-PORTAL R8 — R7 滚动叙事 + center-lock 运动。
     --sheet / --lock 由 CSS view() 时间线驱动；不支持时同一 rAF 写入。
     指针惯性只跟当前封面与播放钮。播放器从封面 FLIP。
     Empty 硬红线：无播钮、封面不可点、不绑 openPlayer、点击不开模态。不改 works.json。 */

  var FLIP_MS = 480;
  var FADE_MS = 240;
  var sheetCss = false;

  var lang = (document.documentElement.getAttribute("data-lang") || "zh").toLowerCase();
  var isZh = lang.indexOf("zh") === 0;

  var I18N = {
    zh: {
      works: "作品",
      eyebrow: "课程作品门户 · Coursework Portal",
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
      videoFailBody: "找不到或无法加载视频文件。请确认 media 路径正确，或改用 python -m http.server 在 portal-video 根目录预览。",
      tasteNote: "Taste 试料，门户自备占位（方法论参考 kuaizengji/taste）",
      close: "关闭",
      loadFailTitle: "加载失败",
      railLabel: "跳到"
    },
    en: {
      works: "Works",
      eyebrow: "Coursework Portal · 课程作品门户",
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
      videoFailBody: "The video file is missing or failed to load. Check the media path, or preview with python -m http.server from the portal-video root.",
      tasteNote: "Taste sample, portal-generated placeholder (methodology ref: kuaizengji/taste)",
      close: "Close",
      loadFailTitle: "Load failed",
      railLabel: "Jump to"
    }
  };
  var t = I18N[isZh ? "zh" : "en"];

  var allGroups = [];

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

  function statusLabel(status) {
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
      if (bySlot[i]) {
        out.push(bySlot[i]);
      } else {
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

  /* ── Hero / 顶栏元信息 ── */
  function splitTitleChars(titleEl, text) {
    /* 逐字蒙版上移：外层裁切，内层上滑；aria 保持整词可读 */
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
      inner.style.setProperty("--cd", 120 + i * 55 + "ms");
      inner.textContent = ch === " " ? "\u00a0" : ch;
      span.appendChild(inner);
      titleEl.appendChild(span);
    });
  }

  function renderShellMeta(meta, groups) {
    setText("course-title", pick(meta, "course_zh", "course_en"));
    setText("hero-eyebrow", t.eyebrow);
    setText("scroll-hint-text", t.scrollHint);

    var titleEl = document.getElementById("page-title");
    if (titleEl) {
      if (prefersReducedMotion()) {
        titleEl.textContent = t.works;
      } else {
        splitTitleChars(titleEl, t.works);
      }
    }

    var metaLine = document.getElementById("meta-line");
    if (metaLine) {
      metaLine.innerHTML = "";
      var term = pick(meta, "term_zh", "term_en");
      var instructor = pick(meta, "instructor_zh", "instructor_en");
      if (term) metaLine.appendChild(el("span", "meta-item", term));
      if (instructor) metaLine.appendChild(el("span", "meta-item", instructor));
      var metaBits = [term, instructor].filter(Boolean);
      if (metaBits.length) {
        metaLine.setAttribute("aria-label", metaBits.join(isZh ? "，" : ", "));
      }
    }

    var counts = countByStatus(groups);
    var summary = document.getElementById("work-summary");
    if (summary) {
      summary.innerHTML = "";
      summary.appendChild(el("span", "summary-tag", counts.ready + " " + t.playable));
      if (counts.broken) {
        summary.appendChild(el("span", "summary-tag is-muted", counts.broken + " " + t.broken));
      }
      summary.appendChild(el("span", "summary-tag is-muted", counts.empty + " " + t.pending));
      var summaryBits = [counts.ready + " " + t.playable];
      if (counts.broken) summaryBits.push(counts.broken + " " + t.broken);
      summaryBits.push(counts.empty + " " + t.pending);
      summary.setAttribute("aria-label", summaryBits.join(isZh ? "，" : ", "));
    }

    setText("note-text", pick(meta, "note_zh", "note_en"));

    var counterTotal = document.getElementById("counter-total");
    if (counterTotal) counterTotal.textContent = slotDigits(groups.length);
  }

  /* ── 逐组展区 ── */
  var PLAY_SVG =
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
    '<path d="M3.5 2.2v7.6L10 6 3.5 2.2Z" fill="currentColor"/></svg>';

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
    slot.style.setProperty("--d", "0ms");
    slot.appendChild(el("span", "slot-code", padSlot(group.slot)));
    slot.appendChild(
      el("span", "slot-count", "— " + slotDigits(group.slot) + " / " + slotDigits(total))
    );
    var nameText = pick(group, "name_zh", "name_en");
    var name = el("h2", "section-name");
    name.style.setProperty("--d", "70ms");
    name.appendChild(el("span", "name-fill", nameText));
    var nameStroke = el("span", "name-stroke", nameText);
    nameStroke.setAttribute("aria-hidden", "true");
    name.appendChild(nameStroke);
    metaCol.appendChild(slot);
    metaCol.appendChild(name);

    var title = pick(group, "title_zh", "title_en");
    if (!(status === "empty" && isDuplicateEmptyTitle(title))) {
      var titleP = el("p", "section-title", title);
      titleP.style.setProperty("--d", "130ms");
      metaCol.appendChild(titleP);
    }

    var statusP = el("p", "section-status", statusLabel(status));
    statusP.style.setProperty("--d", "190ms");
    metaCol.appendChild(statusP);

    if (isPlayableStatus(status)) {
      var btn = el("button", "section-play");
      btn.type = "button";
      btn.style.setProperty("--d", "250ms");
      btn.innerHTML = PLAY_SVG + "<span></span>";
      btn.querySelector("span").textContent = status === "ready" ? t.play : t.brokenCta;
      btn.setAttribute(
        "aria-label",
        (status === "ready" ? t.play : t.brokenCta) + " " + pick(group, "title_zh", "title_en")
      );
      btn.addEventListener("click", function () {
        openPlayer(group, btn);
      });
      metaCol.appendChild(btn);
    }

    var reserve = el("p", "website-reserve", t.websiteReserve);
    reserve.style.setProperty("--d", "300ms");
    metaCol.appendChild(reserve);

    var coverCol = el("div", "section-cover");
    if (isPlayableStatus(status)) {
      /* 封面即播钮：整幅可点，悬停浮出提示 */
      var frame = el("button", "cover-frame");
      frame.type = "button";
      frame.setAttribute(
        "aria-label",
        (status === "ready" ? t.play : t.brokenCta) + " " + title
      );
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
        openPlayer(group, frame);
      });
      coverCol.appendChild(frame);
    } else {
      var pending = el("div", "cover-pending");
      pending.appendChild(el("span", "pending-slot", padSlot(group.slot)));
      pending.appendChild(el("span", "pending-label", t.empty));
      coverCol.appendChild(pending);
    }

    inner.appendChild(metaCol);
    inner.appendChild(coverCol);
    section.appendChild(inner);
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

  /* ── 滚动导航轨 ── */
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
        if (!target) return;
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "center"
        });
      });
      rail.appendChild(btn);
    });
  }

  function moveRailCursor(index) {
    var rail = document.getElementById("works-rail");
    if (!rail) return;
    var cursor = rail.querySelector(".rail-cursor");
    var items = rail.querySelectorAll(".rail-item");
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

  /* ── 显现观察器 ── */
  function wireReveal() {
    var hero = document.getElementById("hero");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      if (hero) hero.classList.add("is-visible");
      var all = document.querySelectorAll(".work-section");
      for (var i = 0; i < all.length; i++) all[i].classList.add("is-visible");
      return;
    }
    var sections = Array.prototype.slice.call(document.querySelectorAll(".work-section"));
    /* 快速长滚可能让中间展区达不到阈值而被跳过、回滚时仍隐形：
       任一展区显现时，把它之前的所有展区一并补亮（单调推进，终态必可见）。 */
    function revealUpTo(idx) {
      for (var i = 0; i <= idx; i++) {
        if (!sections[i].classList.contains("is-visible")) {
          sections[i].classList.add("is-visible");
        }
        io.unobserve(sections[i]);
      }
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            revealUpTo(sections.indexOf(entry.target));
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    sections.forEach(function (s) {
      io.observe(s);
    });
    if (hero) {
      var showHero = function () {
        hero.classList.add("is-visible");
      };
      requestAnimationFrame(function () {
        requestAnimationFrame(showHero);
      });
      /* rAF 在后台标签页不触发；定时兜底保证 hero 终态可见 */
      setTimeout(showHero, 500);
    }
  }

  /* ── 滚动：进度条 + 导航高亮 + 计数器 + 视差（rAF 合帧） ── */
  function wireScroll() {
    var bar = document.getElementById("site-bar");
    var progress = document.getElementById("scroll-progress");
    var hero = document.getElementById("hero");
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY || 0;

      if (bar) {
        if (y > 8) bar.classList.add("is-scrolled");
        else bar.classList.remove("is-scrolled");
      }

      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = max > 0 ? Math.min(1, y / max) : 0;
        progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      }

      /* Hero 离场进度：正文上浮淡出，背景描边字反向漂移 */
      if (hero && !prefersReducedMotion()) {
        var heroH = hero.offsetHeight || 1;
        var heroP = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / heroH));
        hero.style.setProperty("--hero-p", heroP.toFixed(4));
      }

      /* 导航高亮 + 计数器：穿过视口中线的展区 */
      var sections = document.querySelectorAll(".work-section");
      var mid = window.innerHeight * 0.45;
      var activeId = null;
      var activeIdx = -1;
      for (var i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          activeId = sections[i].id;
          activeIdx = i;
          break;
        }
        if (r.top < mid) {
          activeId = sections[i].id;
          activeIdx = i;
        }
      }
      var items = document.querySelectorAll(".rail-item");
      for (var j = 0; j < items.length; j++) {
        var on = items[j].getAttribute("data-target") === activeId;
        if (on) {
          items[j].classList.add("is-active");
          items[j].setAttribute("aria-current", "true");
        } else {
          items[j].classList.remove("is-active");
          items[j].removeAttribute("aria-current");
        }
      }
      if (activeIdx >= 0) setCounter(activeIdx + 1);
      else setCounter(1);
      moveRailCursor(activeIdx);

      /* 无 view() 时间线时，用同一对变量补上 center-lock */
      if (!sheetCss && !prefersReducedMotion()) {
        var viewH = window.innerHeight || 1;
        for (var k = 0; k < sections.length; k++) {
          var rect = sections[k].getBoundingClientRect();
          var total = rect.height + viewH;
          var sheet = total > 0 ? (viewH - rect.top) / total : 0.5;
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

  /* ── 模态（继承契约：Esc / backdrop / 还焦 / fail-box） ── */
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
      playPromise.catch(function () { /* autoplay may be blocked; controls remain */ });
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
    var dest = invertToward(last, target);
    panel.style.transition = "transform " + FLIP_MS + "ms var(--ease-out), opacity " + FLIP_MS + "ms ease";
    panel.style.transform = dest;
    panel.style.opacity = "0";
    return true;
  }

  function openPlayer(group, triggerEl) {
    cacheModal();
    if (!modal) return;
    var status = group.status || "empty";
    if (status === "empty") return; /* 硬红线：Empty 永不开播 */
    if (!isPlayableStatus(status)) return;
    if (modal.classList.contains("is-open") || modal.classList.contains("is-closing")) return;

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    lastTrigger = triggerEl || document.activeElement;

    if (titleEl) titleEl.textContent = pick(group, "title_zh", "title_en");
    if (subEl) {
      var subBits = [pick(group, "name_zh", "name_en")];
      if (
        group.id === "g01" ||
        /taste|试料/i.test(pick(group, "name_zh", "name_en") + pick(group, "title_zh", "title_en"))
      ) {
        subBits.push(t.tasteNote);
      }
      subEl.textContent = subBits.join(", ");
    }

    if (failEl) {
      failEl.hidden = true;
      failEl.innerHTML = "";
    }
    if (videoEl) {
      videoEl.hidden = true;
      videoEl.removeAttribute("src");
    }

    modal.hidden = false;
    modal.classList.remove("is-closing");
    clearPanelMotion();
    document.body.classList.add("is-modal-open");
    document.body.style.overflow = "";
    void modal.offsetWidth;
    modal.classList.add("is-open");
    playFlipOpen(lastTrigger);

    var closeBtn = document.getElementById("player-close");
    if (closeBtn) closeBtn.focus();

    var src = group.video && group.video.src;
    if (!src) {
      showFail(t.videoFailBody);
      return;
    }

    if (group.video.kind === "file" || !/^https?:/i.test(src)) {
      fetch(src, { method: "HEAD" })
        .then(function (res) {
          if (!res.ok) {
            showFail(t.videoFailBody + " (HTTP " + res.status + ")");
            return;
          }
          showVideo(src);
        })
        .catch(function () {
          fetch(src, { method: "GET", headers: { Range: "bytes=0-1" } })
            .then(function (res) {
              if (!res.ok) {
                showFail(t.videoFailBody + " (HTTP " + res.status + ")");
                return;
              }
              showVideo(src);
            })
            .catch(function () {
              showFail(t.videoFailBody);
            });
        });
    } else {
      showVideo(src);
    }

    if (videoEl) {
      videoEl.onerror = function () {
        showFail(t.videoFailBody);
      };
    }
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
    document.body.style.overflow = "";
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
    if (window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var cover = null;
    var hold = null;
    var btn = null;
    var mx = 0;
    var my = 0;
    var cx = 0;
    var cy = 0;
    var raf = 0;

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
      if (!settled) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!cover && hold) {
        hold.style.removeProperty("--ix");
        hold.style.removeProperty("--iy");
        hold = null;
      }
    }

    function ensure() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var nextCover = e.target && e.target.closest ? e.target.closest(".cover-frame") : null;
      var nextBtn = e.target && e.target.closest ? e.target.closest(".section-play") : null;

      if (cover && cover !== nextCover) {
        cover.style.removeProperty("--lx");
        cover.style.removeProperty("--ly");
        if (!nextCover) {
          hold = cover;
          mx = 0;
          my = 0;
        } else {
          cover.style.removeProperty("--ix");
          cover.style.removeProperty("--iy");
          cx = 0;
          cy = 0;
          if (hold && hold !== nextCover) {
            hold.style.removeProperty("--ix");
            hold.style.removeProperty("--iy");
          }
          hold = null;
        }
      }

      if (btn && btn !== nextBtn) {
        btn.style.removeProperty("--bx");
        btn.style.removeProperty("--by");
      }

      cover = nextCover;
      btn = nextBtn;

      if (cover) {
        hold = null;
        var rect = cover.getBoundingClientRect();
        var w = rect.width || 1;
        var h = rect.height || 1;
        mx = ((e.clientX - rect.left) / w) * 2 - 1;
        my = ((e.clientY - rect.top) / h) * 2 - 1;
        cover.style.setProperty("--lx", ((e.clientX - rect.left) / w * 100).toFixed(2) + "%");
        cover.style.setProperty("--ly", ((e.clientY - rect.top) / h * 100).toFixed(2) + "%");
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
      ensure();
    }, { passive: true });
  }

  function boot() {
    /* 显现系统的隐藏起点只在 JS 在场时启用；无 JS 全量可见 */
    if (!prefersReducedMotion()) {
      document.body.classList.add("js-reveal");
      sheetCss = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
      if (sheetCss) document.documentElement.classList.add("sheet-css");
      else document.documentElement.classList.add("sheet-js");
    }
    wireModal();
    var closeBtn = document.getElementById("player-close");
    if (closeBtn) closeBtn.setAttribute("aria-label", t.close);

    fetch("data/works.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        allGroups = ensureTenSlots(data.groups || []);
        renderShellMeta(data.meta || {}, allGroups);
        renderSections(allGroups);
        renderRail(allGroups);
        wireReveal();
        wireScroll();
        wirePointer();
      })
      .catch(function (err) {
        showLoadError(t.loadFail + (err && err.message ? " [" + err.message + "]" : ""));
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
