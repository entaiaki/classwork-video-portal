(function () {
  "use strict";

  var lang = (document.documentElement.getAttribute("data-lang") || "zh").toLowerCase();
  var isZh = lang.indexOf("zh") === 0;

  var I18N = {
    zh: {
      groupWork: "小组作品",
      slot: "槽位",
      ready: "可播放",
      empty: "待提交",
      broken: "不可播",
      play: "点击播放视频",
      emptyCta: "作品尚未提交",
      brokenCta: "视频不可用",
      websiteReserve: "网页入口 · 后续开放",
      loadFail: "无法加载作品数据（data/works.json）。请用本地 http.server 打开本目录，或检查文件是否存在。",
      videoFailTitle: "视频无法播放",
      videoFailBody: "找不到或无法加载视频文件。请确认 media 路径正确，或改用 python -m http.server 在 portal-video 根目录预览。",
      tasteNote: "Taste 试料 · 门户自备占位（方法论参考 kuaizengji/taste）",
      close: "关闭"
    },
    en: {
      groupWork: "Group Work",
      slot: "Slot",
      ready: "Ready",
      empty: "Pending",
      broken: "Unavailable",
      play: "Click to play video",
      emptyCta: "Work not submitted yet",
      brokenCta: "Video unavailable",
      websiteReserve: "Website entry · coming later",
      loadFail: "Could not load data/works.json. Open this folder via a local http.server, or check that the file exists.",
      videoFailTitle: "Video cannot play",
      videoFailBody: "The video file is missing or failed to load. Check the media path, or preview with python -m http.server from the portal-video root.",
      tasteNote: "Taste sample · portal-generated placeholder (methodology ref: kuaizengji/taste)",
      close: "Close"
    }
  };
  var t = I18N[isZh ? "zh" : "en"];

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

  function renderMeta(meta) {
    setText("course-title", pick(meta, "course_zh", "course_en"));
    setText("meta-line", [
      pick(meta, "term_zh", "term_en"),
      pick(meta, "instructor_zh", "instructor_en")
    ].filter(Boolean).join(" · "));
    setText("note-text", pick(meta, "note_zh", "note_en"));
    setText("section-title", t.groupWork);
  }

  function statusLabel(status) {
    if (status === "ready") return t.ready;
    if (status === "broken") return t.broken;
    return t.empty;
  }

  function buildCard(group) {
    var status = group.status || "empty";
    var card = el("article", "card is-" + status);
    card.setAttribute("data-id", group.id || "");
    card.setAttribute("data-slot", String(group.slot || ""));
    card.setAttribute("data-status", status);

    var cover = el("div", "cover");
    var img = document.createElement("img");
    img.src = group.cover || "assets/img/placeholder-cover.svg";
    img.alt = "";
    cover.appendChild(img);
    cover.appendChild(el("span", "badge " + status, statusLabel(status)));
    card.appendChild(cover);

    var body = el("div", "card-body");
    body.appendChild(el("div", "slot-label", t.slot + " " + (group.slot || "—") + " · " + (group.id || "")));
    body.appendChild(el("h3", "group-name", pick(group, "name_zh", "name_en")));
    body.appendChild(el("p", "work-title", pick(group, "title_zh", "title_en")));

    // website_url reserved only — never a clickable outbound link this phase
    body.appendChild(el("div", "website-reserve", t.websiteReserve));

    if (status === "ready") {
      body.appendChild(el("div", "cta", t.play));
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", pick(group, "title_zh", "title_en"));
      card.addEventListener("click", function () { openPlayer(group); });
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          openPlayer(group);
        }
      });
    } else if (status === "broken") {
      body.appendChild(el("div", "cta", t.brokenCta));
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("click", function () { openPlayer(group); });
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          openPlayer(group);
        }
      });
    } else {
      body.appendChild(el("div", "cta", t.emptyCta));
    }

    card.appendChild(body);
    return card;
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

  var modal, videoEl, failEl, titleEl, subEl;

  function cacheModal() {
    modal = document.getElementById("player-modal");
    videoEl = document.getElementById("player-video");
    failEl = document.getElementById("player-fail");
    titleEl = document.getElementById("player-title");
    subEl = document.getElementById("player-sub");
  }

  function showFail(detail) {
    if (videoEl) {
      videoEl.removeAttribute("src");
      videoEl.load();
      videoEl.hidden = true;
    }
    if (failEl) {
      failEl.hidden = false;
      failEl.innerHTML = "";
      failEl.appendChild(el("strong", null, t.videoFailTitle));
      failEl.appendChild(el("p", null, detail || t.videoFailBody));
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

  function openPlayer(group) {
    cacheModal();
    if (!modal) return;
    titleEl.textContent = pick(group, "title_zh", "title_en");
    var subBits = [pick(group, "name_zh", "name_en")];
    if ((group.id === "g01") || /taste|试料/i.test(pick(group, "name_zh", "name_en") + pick(group, "title_zh", "title_en"))) {
      subBits.push(t.tasteNote);
    }
    subEl.textContent = subBits.join(" · ");

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    var src = group.video && group.video.src;
    var status = group.status || "empty";
    if (status === "empty" || !src) {
      showFail(t.videoFailBody);
      return;
    }

    // Probe availability for file kind; url kind still attempt play with error handler
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
          // Some servers disallow HEAD; fall back to GET probe then play
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

  function closePlayer() {
    cacheModal();
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
      videoEl.hidden = true;
    }
    if (failEl) {
      failEl.hidden = true;
      failEl.innerHTML = "";
    }
  }

  function wireModal() {
    cacheModal();
    var closeBtn = document.getElementById("player-close");
    var backdrop = document.getElementById("player-backdrop");
    if (closeBtn) closeBtn.addEventListener("click", closePlayer);
    if (backdrop) backdrop.addEventListener("click", closePlayer);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modal && !modal.hidden) closePlayer();
    });
  }

  function showLoadError(msg) {
    var grid = document.getElementById("works-grid");
    if (!grid) return;
    grid.innerHTML = "";
    var box = el("div", "fail-box");
    box.appendChild(el("strong", null, isZh ? "加载失败" : "Load failed"));
    box.appendChild(el("p", null, msg || t.loadFail));
    grid.appendChild(box);
  }

  function boot() {
    wireModal();
    var closeBtn = document.getElementById("player-close");
    if (closeBtn) closeBtn.setAttribute("aria-label", t.close);

    fetch("data/works.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        renderMeta(data.meta || {});
        var groups = ensureTenSlots(data.groups || []);
        var grid = document.getElementById("works-grid");
        if (!grid) return;
        grid.innerHTML = "";
        groups.forEach(function (g) {
          grid.appendChild(buildCard(g));
        });
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
