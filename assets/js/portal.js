(function () {
  "use strict";

  /* CW-PORTAL-BEAUTIFY-R5 — 滚动叙事版 R7 质感打磨（2026-11-11 用户定调：高级感）
     hero 逐字入场 → 逐组展区（IntersectionObserver 显现）+ 滚动导航轨 + 展区计数器
     + 封面可播态（整幅可点）+ 封面/hero 视差 + 继承播放模态。
     Empty 硬红线：无播钮、封面不可点、不绑 openPlayer、点击不开模态。不改 works.json。 */

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
    /* 逐字入场：拆成 span.char，级联延迟；aria 保持整词可读 */
    titleEl.textContent = "";
    titleEl.setAttribute("aria-label", text);
    titleEl.classList.add("has-chars");
    titleEl.classList.remove("reveal-item");
    var chars = Array.from(text);
    chars.forEach(function (ch, i) {
      var span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--cd", 120 + i * 55 + "ms");
      span.textContent = ch;
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
    var name = el("h2", "section-name", pick(group, "name_zh", "name_en"));
    name.style.setProperty("--d", "70ms");
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
      var img = document.createElement("img");
      img.src = group.cover || "assets/img/placeholder-cover.svg";
      img.alt = "";
      img.loading = "lazy";
      frame.appendChild(img);
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
    var counterCurrent = document.getElementById("counter-current");
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

      /* Hero 描边字缓漂：比页面滚得慢，制造纵深 */
      if (hero && !prefersReducedMotion() && y < window.innerHeight * 1.2) {
        hero.style.setProperty("--hero-drift", (y * 0.09).toFixed(1) + "px");
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
      if (counterCurrent && activeIdx >= 0) {
        counterCurrent.textContent = slotDigits(activeIdx + 1);
      }

      /* 视差：巨号 + 封面，只动装饰/容器，不与显现动画（transform 无关属性）冲突 */
      if (!prefersReducedMotion()) {
        for (var k = 0; k < sections.length; k++) {
          var rect = sections[k].getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
          var p = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
          var ghost = sections[k].querySelector(".section-ghost");
          if (ghost) {
            ghost.style.transform = "translateY(calc(-50% + " + (p * 42).toFixed(1) + "px))";
          }
          var frame = sections[k].querySelector(".cover-frame");
          if (frame) {
            frame.style.transform = "translateY(" + (p * -16).toFixed(1) + "px)";
          }
          var pending = sections[k].querySelector(".cover-pending");
          if (pending) {
            pending.style.transform = "translateY(" + (p * -10).toFixed(1) + "px)";
          }
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
  var modalBusy = false;
  var closeTimer = null;
  var MOTION_MS = 150;

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

  function openPlayer(group, triggerEl) {
    cacheModal();
    if (!modal) return;
    var status = group.status || "empty";
    if (status === "empty") return; /* 硬红线：Empty 永不开播 */
    if (!isPlayableStatus(status)) return;
    if (modalBusy || modal.classList.contains("is-open")) return;
    modalBusy = true;

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
    document.body.style.overflow = "hidden";
    void modal.offsetWidth;
    modal.classList.add("is-open");

    var closeBtn = document.getElementById("player-close");
    if (closeBtn) closeBtn.focus();

    var src = group.video && group.video.src;
    if (!src) {
      showFail(t.videoFailBody);
      modalBusy = false;
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
    modalBusy = false;
  }

  function finishClose() {
    cacheModal();
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove("is-open");
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
    modalBusy = false;
    closeTimer = null;
    if (restore && typeof restore.focus === "function") {
      try { restore.focus(); } catch (e) { /* ignore */ }
    }
  }

  function closePlayer() {
    cacheModal();
    if (!modal || modal.hidden) return;
    if (!modal.classList.contains("is-open") && modal.hidden) return;

    modal.classList.remove("is-open");
    if (videoEl) {
      try { videoEl.pause(); } catch (e) { /* ignore */ }
    }

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(finishClose, MOTION_MS);
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

  function boot() {
    /* 显现系统的隐藏起点只在 JS 在场时启用；无 JS 全量可见 */
    if (!prefersReducedMotion()) {
      document.body.classList.add("js-reveal");
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
