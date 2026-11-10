(function () {
  "use strict";

  /* CW-PORTAL-BEAUTIFY-R5 — 应用壳 + 作品索引 (App-shell + Work Index)
     renderShellMeta / renderDetail / renderIndex.
     Empty: no openPlayer binding, no play control. Do not change works.json. */

  var lang = (document.documentElement.getAttribute("data-lang") || "zh").toLowerCase();
  var isZh = lang.indexOf("zh") === 0;

  var I18N = {
    zh: {
      works: "作品",
      all: "全部",
      playable: "可播放",
      pending: "待提交",
      slot: "槽位",
      ready: "可播放",
      empty: "待提交",
      broken: "不可播",
      play: "播放",
      brokenCta: "视频不可用",
      websiteReserve: "网页入口，后续开放",
      loadFail: "无法加载作品数据（data/works.json）。请用本地 http.server 打开本目录，或检查文件是否存在。",
      videoFailTitle: "视频无法播放",
      videoFailBody: "找不到或无法加载视频文件。请确认 media 路径正确，或改用 python -m http.server 在 portal-video 根目录预览。",
      tasteNote: "Taste 试料，门户自备占位（方法论参考 kuaizengji/taste）",
      close: "关闭",
      loadFailTitle: "加载失败",
      detailEmpty: "暂无可播放作品",
      detailEmptyHint: "请从下方作品索引查看各组进度。",
      viewIndex: "查看作品索引",
      detailPendingHint: "该组作品尚未提交。",
      filterLabel: "按状态筛选"
    },
    en: {
      works: "Works",
      all: "All",
      playable: "Playable",
      pending: "Pending",
      slot: "Slot",
      ready: "Ready",
      empty: "Pending",
      broken: "Unavailable",
      play: "Play",
      brokenCta: "Unavailable",
      websiteReserve: "Website entry, coming later",
      loadFail: "Could not load data/works.json. Open this folder via a local http.server, or check that the file exists.",
      videoFailTitle: "Video cannot play",
      videoFailBody: "The video file is missing or failed to load. Check the media path, or preview with python -m http.server from the portal-video root.",
      tasteNote: "Taste sample, portal-generated placeholder (methodology ref: kuaizengji/taste)",
      close: "Close",
      loadFailTitle: "Load failed",
      detailEmpty: "No playable work yet",
      detailEmptyHint: "Use the work index below to review each group's status.",
      viewIndex: "View work index",
      detailPendingHint: "This group's work has not been submitted yet.",
      filterLabel: "Filter by status"
    }
  };
  var t = I18N[isZh ? "zh" : "en"];

  var allGroups = [];
  var selectedId = null;
  var activeFilter = "all"; /* all | playable | pending */
  /* playable filter includes ready + broken (documented in self-check) */

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

  function findGroup(id) {
    if (!id) return null;
    for (var i = 0; i < allGroups.length; i++) {
      if (allGroups[i] && allGroups[i].id === id) return allGroups[i];
    }
    return null;
  }

  function firstReady(groups) {
    for (var i = 0; i < (groups || []).length; i++) {
      if ((groups[i].status || "empty") === "ready") return groups[i];
    }
    return null;
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

  /* ── Shell meta (no middle-dot joins) ── */
  function renderShellMeta(meta, groups) {
    setText("course-title", pick(meta, "course_zh", "course_en"));
    setText("page-title", t.works);

    var metaLine = document.getElementById("meta-line");
    if (metaLine) {
      metaLine.innerHTML = "";
      var term = pick(meta, "term_zh", "term_en");
      var instructor = pick(meta, "instructor_zh", "instructor_en");
      if (term) {
        metaLine.appendChild(el("span", "meta-item", term));
      }
      if (instructor) {
        metaLine.appendChild(el("span", "meta-item", instructor));
      }
      var metaBits = [term, instructor].filter(Boolean);
      if (metaBits.length) {
        metaLine.setAttribute("aria-label", metaBits.join(isZh ? "，" : ", "));
      }
    }

    var counts = countByStatus(groups);
    var summary = document.getElementById("work-summary");
    if (summary) {
      summary.innerHTML = "";
      var readyTag = el("span", "summary-tag", counts.ready + " " + t.playable);
      summary.appendChild(readyTag);
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

    var filterNav = document.getElementById("index-filter");
    if (filterNav) {
      filterNav.setAttribute("aria-label", t.filterLabel);
      var buttons = filterNav.querySelectorAll("button[data-filter]");
      for (var i = 0; i < buttons.length; i++) {
        var btn = buttons[i];
        var key = btn.getAttribute("data-filter");
        if (key === "all") btn.textContent = t.all;
        else if (key === "playable") btn.textContent = t.playable;
        else if (key === "pending") btn.textContent = t.pending;
      }
    }
  }

  /* ── Detail inspector ── */
  function renderDetail(selected) {
    var root = document.getElementById("work-detail");
    if (!root) return;
    root.innerHTML = "";

    if (!selected) {
      var empty = el("div", "detail-empty");
      empty.id = "detail-empty";
      empty.appendChild(el("p", "detail-empty-title", t.detailEmpty));
      empty.appendChild(el("p", "detail-empty-hint", t.detailEmptyHint));
      var link = el("a", null, t.viewIndex);
      link.href = "#work-index";
      empty.appendChild(link);
      root.appendChild(empty);
      return;
    }

    var status = selected.status || "empty";

    if (status === "empty") {
      var pending = el("div", "detail-pending");
      pending.appendChild(el("p", "detail-slot", padSlot(selected.slot)));
      pending.appendChild(el("h2", "detail-title", pick(selected, "name_zh", "name_en")));
      pending.appendChild(el("p", "detail-status", t.empty));
      pending.appendChild(el("p", "detail-hint", t.detailPendingHint));
      pending.appendChild(el("p", "website-reserve", t.websiteReserve));
      root.appendChild(pending);
      return;
    }

    var card = el("div", "detail-card is-" + status);

    var cover = el("div", "detail-cover");
    var img = document.createElement("img");
    img.src = selected.cover || "assets/img/placeholder-cover.svg";
    img.alt = "";
    cover.appendChild(img);
    card.appendChild(cover);

    var info = el("div", "detail-info");
    info.appendChild(el("p", "detail-slot", padSlot(selected.slot)));
    info.appendChild(el("h2", "detail-title", pick(selected, "title_zh", "title_en")));
    info.appendChild(el("p", "detail-group", pick(selected, "name_zh", "name_en")));
    info.appendChild(el("p", "detail-status", statusLabel(status)));

    var playBtn = el("button", "selected-play");
    playBtn.type = "button";
    playBtn.id = "selected-play";
    playBtn.textContent = status === "ready" ? t.play : t.brokenCta;
    playBtn.setAttribute(
      "aria-label",
      (status === "ready" ? t.play : t.brokenCta) + " " + pick(selected, "title_zh", "title_en")
    );
    playBtn.addEventListener("click", function () {
      openPlayer(selected, playBtn);
    });
    info.appendChild(playBtn);
    info.appendChild(el("p", "website-reserve", t.websiteReserve));

    card.appendChild(info);
    root.appendChild(card);
  }

  /* ── Index rows ── */
  function rowMatchesFilter(group, filter) {
    var status = group.status || "empty";
    if (filter === "playable") return isPlayableStatus(status);
    if (filter === "pending") return status === "empty";
    return true;
  }

  function buildWorkRow(group) {
    var status = group.status || "empty";
    var row = el("div", "work-row is-" + status);
    row.setAttribute("role", "listitem");
    row.setAttribute("data-id", group.id || "");
    row.setAttribute("data-slot", String(group.slot || ""));
    row.setAttribute("data-status", status);
    if (selectedId && group.id === selectedId) {
      row.classList.add("is-selected");
    }

    row.appendChild(el("span", "row-slot", padSlot(group.slot)));
    row.appendChild(el("span", "row-name", pick(group, "name_zh", "name_en")));

    var title = pick(group, "title_zh", "title_en");
    if (status === "empty" && isDuplicateEmptyTitle(title)) {
      row.appendChild(el("span", "row-title is-blank", ""));
    } else {
      row.appendChild(el("span", "row-title", title));
    }

    row.appendChild(el("span", "row-status", statusLabel(status)));

    var action = el("div", "row-action");
    if (isPlayableStatus(status)) {
      var btn = el("button", "row-play");
      btn.type = "button";
      btn.textContent = status === "ready" ? t.play : t.brokenCta;
      btn.setAttribute(
        "aria-label",
        (status === "ready" ? t.play : t.brokenCta) + " " + pick(group, "title_zh", "title_en")
      );
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        selectWork(group);
        var liveBtn = document.querySelector(
          '.work-row[data-id="' + (group.id || "") + '"] .row-play'
        );
        openPlayer(group, liveBtn || btn);
      });
      action.appendChild(btn);
    } else {
      row.setAttribute("aria-disabled", "true");
    }
    row.appendChild(action);

    row.addEventListener("click", function () {
      selectWork(group);
    });

    return row;
  }

  function renderIndex(groups, filter) {
    var list = document.getElementById("work-list");
    if (!list) return;
    list.innerHTML = "";
    (groups || []).forEach(function (g) {
      var row = buildWorkRow(g);
      if (!rowMatchesFilter(g, filter || "all")) {
        row.hidden = true;
      }
      list.appendChild(row);
    });
  }

  function syncFilterButtons() {
    var filterNav = document.getElementById("index-filter");
    if (!filterNav) return;
    var buttons = filterNav.querySelectorAll("button[data-filter]");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-filter") === activeFilter;
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
      if (on) buttons[i].classList.add("is-active");
      else buttons[i].classList.remove("is-active");
    }
  }

  function selectWork(group) {
    if (!group) return;
    selectedId = group.id || null;
    renderDetail(group);
    renderIndex(allGroups, activeFilter);
  }

  function wireFilter() {
    var filterNav = document.getElementById("index-filter");
    if (!filterNav) return;
    filterNav.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button[data-filter]");
      if (!btn) return;
      var next = btn.getAttribute("data-filter") || "all";
      activeFilter = next;
      syncFilterButtons();
      renderIndex(allGroups, activeFilter);
    });
  }

  /* ── Modal (ported from R4: Esc / backdrop / focus restore / fail-box) ── */
  var modal, videoEl, failEl, titleEl, subEl;
  var lastTrigger = null;
  var modalBusy = false;
  var closeTimer = null;
  var MOTION_MS = 180; /* modal opacity ≤200ms */

  function cacheModal() {
    modal = document.getElementById("player-modal");
    videoEl = document.getElementById("player-video");
    failEl = document.getElementById("player-fail");
    titleEl = document.getElementById("player-title");
    subEl = document.getElementById("player-sub");
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    if (status === "empty") return; /* hard red line: never open for Empty */
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
    var mount = document.getElementById("workspace") || document.querySelector("main");
    if (!mount) return;
    var detail = document.getElementById("work-detail");
    var list = document.getElementById("work-list");
    if (detail) detail.innerHTML = "";
    if (list) list.innerHTML = "";
    var box = el("div", "fail-box");
    box.appendChild(el("strong", null, t.loadFailTitle));
    box.appendChild(el("p", null, msg || t.loadFail));
    var wrap = mount.querySelector(".wrap") || mount;
    wrap.appendChild(box);
  }

  function boot() {
    wireModal();
    wireFilter();
    syncFilterButtons();
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
        var ready = firstReady(allGroups);
        selectedId = ready ? ready.id : null;
        renderDetail(ready);
        renderIndex(allGroups, activeFilter);
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
