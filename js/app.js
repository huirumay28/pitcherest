(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = PB;

  /* ---------- icons ---------- */
  var ICON = {
    check: '<svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.4 2.4 4.6-5"/></svg>',
    chev: '<svg class="ico" viewBox="0 0 16 16"><path d="M4 6.5l4 4 4-4"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    spark: '<svg class="ico" viewBox="0 0 12 12" style="width:10px;height:10px;stroke:var(--accent);opacity:.8"><path d="M6 1.5v3M6 7.5v3M1.5 6h3M7.5 6h3"/></svg>',
    play: '<svg class="ico" viewBox="0 0 10 10"><path d="M2.5 1.5l6 3.5-6 3.5z"/></svg>',
    pause: '<svg class="ico" viewBox="0 0 10 10"><path d="M2.5 1.5h2v7h-2zM5.5 1.5h2v7h-2z"/></svg>',
    plus: '<svg class="ico" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>',
    tick: '<svg class="ico" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    box: '<svg viewBox="0 0 20 20"><rect x="3.5" y="4.5" width="13" height="11" rx="1.5"/><path d="M3.5 8.5h13M8 12h4"/></svg>'
  };
  var TH = {
    moodboard: '<svg viewBox="0 0 40 30"><rect x="3" y="3" width="15" height="13" rx="1.5"/><rect x="21" y="3" width="16" height="8" rx="1.5"/><rect x="21" y="14" width="16" height="13" rx="1.5"/><rect x="3" y="19" width="15" height="8" rx="1.5"/></svg>',
    table: '<svg viewBox="0 0 40 30"><path d="M3 6h34M3 13h34M3 20h34M3 27h34M14 3v24"/></svg>',
    summary: '<svg viewBox="0 0 40 30"><path d="M6 6h14M6 12h28M6 17h28M6 22h20"/></svg>',
    timeline: '<svg viewBox="0 0 40 30"><path d="M8 3v24"/><circle cx="8" cy="8" r="2"/><circle cx="8" cy="15" r="2"/><circle cx="8" cy="22" r="2"/><path d="M15 8h18M15 15h12M15 22h16"/></svg>'
  };

  /* ---------- state ---------- */
  var S = {
    items: D.ITEMS.slice(),
    sel: new Set(),
    f: { type: new Set(), dept: new Set(), topic: new Set() },
    q: "",
    role: "strategy",
    tpl: "table",
    sort: { key: "date", dir: 1 },
    open: new Set(),
    uploadN: 0,
    sorting: new Set(),
    busy: false,
    answered: 0
  };
  var byId = function (id) { return S.items.filter(function (i) { return i.id === id; })[0] || D.UPLOADS.filter(function (i) { return i.id === id; })[0]; };
  var fmtDate = function (d) { var p = d.split("-"); return (+p[1]) + " 月 " + (+p[2]) + " 日"; };
  var shortDate = function (d) { var p = d.split("-"); return p[1] + "/" + p[2]; };
  var fmtLong = function (d) { var p = d.split("-"); return p[0] + " 年 " + (+p[1]) + " 月 " + (+p[2]) + " 日"; };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function bars(id, n, cls) {
    var r = rng(hash(id)), out = "";
    for (var i = 0; i < n; i++) { var env = .35 + .65 * Math.abs(Math.sin(i / n * 5 + r() * 1.3)); out += '<i style="height:' + Math.max(12, Math.round(env * (.4 + r() * .6) * 100)) + '%"></i>'; }
    return out;
  }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function toast(msg) { var t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600); }
  var isTabbed = function () { return window.matchMedia("(max-width:1179px)").matches; };
  function goTab(t) { document.body.dataset.tab = t; $$("#tabbar button").forEach(function (b) { b.classList.toggle("on", b.dataset.go === t); }); }

  /* ---------- project switcher ---------- */
  function initProject() {
    $("#projectName").textContent = D.PROJECTS[0].name;
    var pop = $("#projectPop"), btn = $("#projectBtn");
    pop.innerHTML = D.PROJECTS.map(function (p, i) {
      return '<button data-i="' + i + '" class="' + (i === 0 ? "cur" : "") + '"><div class="pn">' + p.name + '</div><div class="pm">' + p.meta + '</div></button>';
    }).join("") + '<div class="pnote">這是示範版本，目前只提供第一個比稿專案的內容。</div>';
    btn.addEventListener("click", function (e) { e.stopPropagation(); var open = pop.hidden; pop.hidden = !open; btn.setAttribute("aria-expanded", open); });
    pop.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      pop.hidden = true; btn.setAttribute("aria-expanded", false);
      if (b.dataset.i !== "0") toast("示範版本目前只提供「某飲料品牌新品上市」的內容。");
    });
  }

  /* ---------- archive ---------- */
  function visibleItems() {
    var q = S.q.trim().toLowerCase();
    return S.items.filter(function (it) {
      if (S.f.type.size && !S.f.type.has(it.type)) return false;
      if (S.f.dept.size && !S.f.dept.has(it.dept)) return false;
      if (S.f.topic.size && !it.topics.some(function (t) { return S.f.topic.has(t); })) return false;
      if (q && (it.title + it.excerpt + it.type + it.dept + it.topics.join("")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  }
  function itemHTML(it) {
    var sel = S.sel.has(it.id), open = S.open.has(it.id), sorting = S.sorting.has(it.id);
    var right = it.img ? '<img class="thumb" loading="lazy" alt="" src="assets/img/' + it.img + '">' : it.type === "錄音" ? '<div class="vmini">' + bars(it.id + "m", 14) + '</div>' : "";
    var meta = sorting ? '<div class="sorting"><i></i>正在自動分類…</div>' :
      '<div class="item-meta"><span>' + it.type + '</span><span class="dot"></span><span>' + it.dept + '</span><span class="dot"></span><span>' + fmtDate(it.date) + '</span></div>' +
      '<div class="tags">' + it.topics.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("") + '<span class="auto" title="由系統自動判斷類型、部門與主題">' + ICON.spark + '自動分類</span></div>';
    return '<li class="item' + (sel ? " sel" : "") + (open ? " open" : "") + (it._new ? " new" : "") + '" data-id="' + it.id + '">' +
      '<div class="item-row" data-act="open"><button class="cb" data-act="sel" role="checkbox" aria-checked="' + sel + '" aria-label="選取「' + esc(it.title) + '」">' + ICON.check + '</button>' +
      '<div class="item-main"><div class="item-title">' + it.title + '</div>' + meta + '</div>' + right + '</div>' +
      '<div class="item-detail">' + detailHTML(it) + '</div></li>';
  }
  function detailHTML(it) {
    var h = "";
    if (it.img) h += '<img class="big" loading="lazy" alt="' + esc(it.title) + '" data-act="zoom" src="assets/img/' + it.img + '">';
    if (it.type === "錄音") {
      h += '<div class="wave"><button class="play" data-act="play" aria-label="播放示意">' + ICON.play + '</button><div class="bars" data-id="' + it.id + '">' + bars(it.id, 64) + '</div><span class="dur">' + it.dur + '</span></div>';
      h += '<div class="tr">' + it.transcript.map(function (t) { return '<p><span class="tm">' + t[0] + "　" + t[1] + '</span>' + t[2] + '</p>'; }).join("") + '</div>';
    } else if (it.type === "消費者訪談") {
      h += '<div class="quote-q">' + it.excerpt + '</div>';
    } else h += '<p class="ex">' + it.excerpt + '</p>';
    return h;
  }
  function renderList(keep) {
    var list = visibleItems(), ul = $("#items");
    $("#archiveCount").textContent = list.length === S.items.length ? "共 " + S.items.length + " 項" : "顯示 " + list.length + " / " + S.items.length + " 項";
    ul.innerHTML = list.length ? list.map(itemHTML).join("") : '<li class="empty-list">找不到符合條件的資料。<br><button class="link" data-act="clearf">清除所有篩選</button></li>';
    S.items.forEach(function (i) { delete i._new; });
    renderQuick(list);
    renderSelbar();
  }
  function renderQuick(list) {
    var html = '<span class="ql">挑選：</span>' + D.PRESETS.map(function (p, i) { return '<button data-preset="' + i + '">' + p.label + '</button>'; }).join("") +
      '<button data-act="all">全選目前結果</button>';
    $("#quick").innerHTML = html;
  }
  function renderSelbar() {
    var n = S.sel.size, bar = $("#selbar");
    bar.hidden = n === 0; $("#selCount").textContent = "已選取 " + n + " 項";
    var b = $("#tabBadge"); b.hidden = n === 0; b.textContent = n;
  }
  function counts(key) {
    var c = {};
    S.items.forEach(function (it) { (key === "topic" ? it.topics : [it[key]]).forEach(function (v) { c[v] = (c[v] || 0) + 1; }); });
    return c;
  }
  var FNAMES = { type: "類型", dept: "部門", topic: "主題" };
  function renderFilters(openKey) {
    var box = $("#filters"), html = "";
    ["type", "dept", "topic"].forEach(function (k) {
      var n = S.f[k].size;
      html += '<button class="fbtn' + (n ? " on" : "") + '" data-f="' + k + '" aria-haspopup="true" aria-expanded="' + (openKey === k) + '">' + FNAMES[k] + (n ? " · " + n : "") + ICON.chev + '</button>';
    });
    if (S.f.type.size + S.f.dept.size + S.f.topic.size) html += '<button class="link" data-act="clearf" style="margin-left:6px">清除</button>';
    if (openKey) {
      var list = openKey === "type" ? D.TYPES : openKey === "dept" ? D.DEPTS : D.TOPICS, c = counts(openKey);
      html += '<div class="popover fpop" data-pop="' + openKey + '">' + list.map(function (v) {
        return '<label><input type="checkbox" data-fv="' + v + '"' + (S.f[openKey].has(v) ? " checked" : "") + ' style="accent-color:var(--accent)"><span>' + v + '</span><span class="n">' + (c[v] || 0) + '</span></label>';
      }).join("") + '</div>';
    }
    box.innerHTML = html;
  }
  var openFilter = null;
  function setFilterOpen(k) { openFilter = k; renderFilters(k); }

  function toggleSel(id, on) {
    var has = S.sel.has(id); if (on === undefined) on = !has;
    if (on) S.sel.add(id); else S.sel.delete(id);
    var li = $('.item[data-id="' + id + '"]');
    if (li) { li.classList.toggle("sel", on); $(".cb", li).setAttribute("aria-checked", on); }
    renderSelbar(); renderView();
  }
  function revealItem(id) {
    var it = byId(id); if (!it) return;
    var vis = visibleItems().some(function (i) { return i.id === id; });
    if (!vis) { S.f = { type: new Set(), dept: new Set(), topic: new Set() }; S.q = ""; $("#searchInput").value = ""; renderFilters(); }
    S.open.add(id); renderList();
    if (isTabbed()) goTab("archive");
    var li = $('.item[data-id="' + id + '"]');
    if (li) {
      var sc = $("#listScroll");
      sc.scrollTo({ top: li.offsetTop - 12, behavior: "smooth" });
      li.classList.remove("hl"); void li.offsetWidth; li.classList.add("hl");
    }
  }

  function initArchive() {
    renderFilters(); renderList();
    $("#searchInput").addEventListener("input", function (e) { S.q = e.target.value; renderList(); });
    $("#filters").addEventListener("click", function (e) {
      e.stopPropagation();
      var b = e.target.closest("[data-f]");
      if (b) { setFilterOpen(openFilter === b.dataset.f ? null : b.dataset.f); return; }
      if (e.target.closest('[data-act="clearf"]')) { S.f = { type: new Set(), dept: new Set(), topic: new Set() }; setFilterOpen(null); renderList(); }
    });
    $("#filters").addEventListener("change", function (e) {
      var v = e.target.dataset.fv; if (v == null) return;
      var k = openFilter; if (e.target.checked) S.f[k].add(v); else S.f[k].delete(v);
      var scroll = $(".fpop") ? $(".fpop").scrollTop : 0; renderFilters(k); if ($(".fpop")) $(".fpop").scrollTop = scroll; renderList();
    });
    document.addEventListener("click", function (e) {
      if (openFilter && !e.target.closest(".fpop")) setFilterOpen(null);
      if (!e.target.closest(".switcher")) { $("#projectPop").hidden = true; $("#projectBtn").setAttribute("aria-expanded", false); }
    });
    $("#quick").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.preset != null) {
        var p = D.PRESETS[b.dataset.preset]; p.ids.forEach(function (id) { S.sel.add(id); });
        renderList(); renderView(); toast("已選取「" + p.label + "」相關的 " + p.ids.length + " 項資料。");
      } else if (b.dataset.act === "all") {
        var l = visibleItems(); l.forEach(function (i) { S.sel.add(i.id); }); renderList(); renderView(); toast("已選取目前列表中的 " + l.length + " 項資料。");
      }
    });
    $("#items").addEventListener("click", function (e) {
      var li = e.target.closest(".item"); if (!li) { if (e.target.closest('[data-act="clearf"]')) { S.f = { type: new Set(), dept: new Set(), topic: new Set() }; S.q = ""; $("#searchInput").value = ""; renderFilters(); renderList(); } return; }
      var id = li.dataset.id, act = e.target.closest("[data-act]");
      act = act ? act.dataset.act : null;
      if (act === "sel") { e.stopPropagation(); toggleSel(id); return; }
      if (act === "zoom") { lightbox($("img", li).src); return; }
      if (act === "play") { playDemo(li); return; }
      if (e.target.closest(".item-detail")) return;
      if (S.open.has(id)) { S.open.delete(id); li.classList.remove("open"); } else { S.open.add(id); li.classList.add("open"); }
    });
    $("#selClear").addEventListener("click", function () { S.sel.clear(); renderList(); renderView(); });
    $("#goView").addEventListener("click", function () { goTab("view"); });
    $("#uploadBtn").addEventListener("click", function () { fakeUpload(); });
    var dz = $("#dropzone");
    ["dragenter", "dragover"].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.dataTransfer && e.dataTransfer.types.indexOf("Files") >= 0) { e.preventDefault(); dz.classList.add("over"); } }); });
    ["dragleave", "drop"].forEach(function (ev) { document.addEventListener(ev, function (e) { dz.classList.remove("over"); }); });
    document.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); fakeUpload(e.dataTransfer.files[0].name); } });
    dz.addEventListener("click", function () { fakeUpload(); });
  }
  function fakeUpload(name) {
    var tpl = D.UPLOADS[S.uploadN % D.UPLOADS.length], n = S.uploadN++;
    var it = Object.assign({}, tpl, { id: tpl.id + (n >= D.UPLOADS.length ? "-" + n : ""), _new: true });
    if (name) it.title = name;
    S.items.unshift(it); S.sorting.add(it.id); S.open.delete(it.id);
    S.f = { type: new Set(), dept: new Set(), topic: new Set() }; S.q = ""; $("#searchInput").value = ""; renderFilters(); renderList();
    $("#listScroll").scrollTo({ top: 0, behavior: "smooth" });
    toast("已收到檔案，正在自動分類。");
    setTimeout(function () {
      S.sorting.delete(it.id); renderList();
      toast("已自動分類：" + it.type + "、" + it.dept + "、" + it.topics.join("、") + "。");
    }, 1700);
  }
  var playT = null;
  function playDemo(li) {
    var btn = $(".play", li), bs = $$(".bars i", li);
    if (playT) { clearInterval(playT); playT = null; if (btn.dataset.on) { btn.dataset.on = ""; btn.innerHTML = ICON.play; bs.forEach(function (b) { b.classList.remove("p"); }); return; } }
    $$(".play").forEach(function (b) { b.dataset.on = ""; b.innerHTML = ICON.play; });
    btn.dataset.on = "1"; btn.innerHTML = ICON.pause; var i = 0; bs.forEach(function (b) { b.classList.remove("p"); });
    playT = setInterval(function () { if (i < bs.length) bs[i++].classList.add("p"); else { clearInterval(playT); playT = null; btn.dataset.on = ""; btn.innerHTML = ICON.play; } }, 110);
  }
  function lightbox(src) {
    var d = document.createElement("div"); d.className = "lightbox"; d.innerHTML = '<img alt="" src="' + src + '">';
    d.addEventListener("click", function () { d.remove(); }); document.body.appendChild(d);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var l = $(".lightbox"); if (l) l.remove(); setFilterOpen(null); } });

  /* ---------- ask ---------- */
  function citeHTML(id, map) {
    var it = byId(id); if (!map[id]) map[id] = ++map._n;
    return '<button class="cite" data-cite="' + id + '" data-tip="' + esc(it.title) + '" aria-label="來源 ' + map[id] + "：" + esc(it.title) + '">' + map[id] + '</button>';
  }
  function inline(s, map) {
    return s.replace(/\s?\[\[([\w-]+)\]\]/g, function (_, id) { return citeHTML(id, map); });
  }
  function answerHTML(qa, upto, map) {
    // reveal only `upto` visible characters (citations count as 0 but appear once their sentence ends)
    var left = upto, out = "";
    function take(s) {
      var res = "", parts = s.split(/(\s?\[\[[\w-]+\]\])/);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (/\[\[/.test(p)) { if (left >= 0 && res !== null) res += inline(p, map); continue; }
        if (left <= 0) { left = -1; break; }
        if (p.length <= left) { res += esc(p); left -= p.length; } else { res += esc(p.slice(0, left)); left = -1; break; }
      }
      return res;
    }
    for (var b = 0; b < qa.blocks.length; b++) {
      if (left < 0) break;
      var blk = qa.blocks[b];
      if (blk.t === "p") out += "<p>" + take(blk.s) + "</p>";
      else { out += "<ul>"; for (var j = 0; j < blk.items.length && left >= 0; j++) out += "<li>" + take(blk.items[j]) + "</li>"; out += "</ul>"; }
    }
    return out;
  }
  function plainLen(qa) {
    var n = 0; qa.blocks.forEach(function (b) { (b.t === "p" ? [b.s] : b.items).forEach(function (s) { n += s.replace(/\s?\[\[[\w-]+\]\]/g, "").length; }); }); return n;
  }
  function citedIds(qa) {
    var ids = [], seen = {};
    qa.blocks.forEach(function (b) { (b.t === "p" ? [b.s] : b.items).forEach(function (s) { s.replace(/\[\[([\w-]+)\]\]/g, function (_, id) { if (!seen[id]) { seen[id] = 1; ids.push(id); } }); }); });
    return ids;
  }
  function scrollChat() { var c = $("#chatScroll"); c.scrollTo({ top: c.scrollHeight, behavior: "smooth" }); }
  function renderWelcome() {
    $("#chat").innerHTML = '<div class="welcome"><h1>你可以直接問這個資料庫任何問題。</h1>' +
      '<p class="sub">所有回答都只根據這場比稿已經放進資料庫的內容，每一句話也都會附上來源，讓你可以回頭確認原始資料。</p>' +
      '<div class="suggest-label">試試看這些問題</div><div class="suggest">' +
      D.QA.map(function (q) { return '<button data-q="' + q.id + '"><span>' + q.q + '</span>' + ICON.arrow + '</button>'; }).join("") + '</div></div>';
    $("#chatReset").hidden = true;
  }
  function addQuestion(text) {
    var w = $(".welcome"); if (w) w.remove();
    var d = document.createElement("div"); d.className = "msg-q"; var s = document.createElement("span"); s.textContent = text; d.appendChild(s); $("#chat").appendChild(d);
    $("#chatReset").hidden = false; scrollChat();
  }
  function ask(text, qa) {
    if (S.busy) return;
    S.busy = true; addQuestion(text);
    var a = document.createElement("div"); a.className = "msg-a";
    a.innerHTML = '<div class="label">' + ICON.spark.replace("width:10px;height:10px;", "") + 'PITCHEREST</div><div class="answer"><div class="thinking"><i></i><i></i><i></i></div></div>';
    $("#chat").appendChild(a); scrollChat();
    var ans = $(".answer", a);
    setTimeout(function () {
      if (!qa) return finishFallback(a, ans);
      var total = plainLen(qa), n = 0, map = { _n: 0 }, skip = false;
      a.dataset.typing = "1";
      ans.onclick = function () { skip = true; };
      (function tick() {
        n = skip ? total : Math.min(total, n + 3);
        ans.innerHTML = answerHTML(qa, n, { _n: 0 }); 
        if (n % 30 === 0 || n >= total) scrollChat();
        if (n < total) return setTimeout(tick, 24);
        ans.onclick = null; finishAnswer(a, qa);
      })();
    }, 750);
  }
  function finishAnswer(a, qa) {
    var ids = citedIds(qa), map = { _n: 0 };
    $(".answer", a).innerHTML = answerHTML(qa, 99999, map);
    var allSel = ids.every(function (id) { return S.sel.has(id); });
    var src = document.createElement("div"); src.className = "sources"; src.dataset.ids = ids.join(",");
    src.innerHTML = '<div class="sh"><span>來源　' + ids.length + ' 項</span><button class="add-sel' + (allSel ? " done" : "") + '" data-act="addsel">' + (allSel ? ICON.tick + "已加入選取" : ICON.plus + "將這些來源加入選取") + '</button></div>' +
      ids.map(function (id) { var it = byId(id); return '<button class="src" data-cite="' + id + '"><span class="num">' + map[id] + '</span><span class="st">' + it.title + '</span><span class="sm">' + it.type + '</span></button>'; }).join("");
    a.appendChild(src);
    var f = document.createElement("div"); f.className = "follow";
    f.innerHTML = qa.next.map(function (id) { return '<button class="chip" data-q="' + id + '">' + D.QA.filter(function (q) { return q.id === id; })[0].q + '</button>'; }).join("");
    a.appendChild(f); a.dataset.typing = ""; S.busy = false; S.answered++; scrollChat();
  }
  function finishFallback(a, ans) {
    ans.className = "answer fallback";
    ans.innerHTML = '<p>這個示範版本目前只能回答下方的建議問題，還沒有辦法處理其他內容。你可以直接點選下面的任一問題試試看；正式版本則可以針對整個資料庫自由提問。</p>';
    var f = document.createElement("div"); f.className = "follow";
    f.innerHTML = D.QA.map(function (q) { return '<button class="chip" data-q="' + q.id + '">' + q.q + '</button>'; }).join("");
    a.appendChild(f); S.busy = false; scrollChat();
  }
  function match(text) {
    var t = text.replace(/\s+/g, ""), best = null, score = 0;
    D.QA.forEach(function (qa) {
      var s = 0; if (t === qa.q.replace(/\s+/g, "")) s = 100;
      qa.keys.forEach(function (k) { if (t.toLowerCase().indexOf(k.toLowerCase()) >= 0) s += k.length; });
      if (s > score) { score = s; best = qa; }
    });
    return best;
  }
  function initAsk() {
    renderWelcome();
    $("#chat").addEventListener("click", function (e) {
      var q = e.target.closest("[data-q]");
      if (q) { var qa = D.QA.filter(function (x) { return x.id === q.dataset.q; })[0]; ask(qa.q, qa); return; }
      var c = e.target.closest("[data-cite]");
      if (c) { revealItem(c.dataset.cite); return; }
      var add = e.target.closest('[data-act="addsel"]');
      if (add) {
        var ids = add.closest(".sources").dataset.ids.split(","), fresh = ids.filter(function (id) { return !S.sel.has(id); });
        ids.forEach(function (id) { S.sel.add(id); }); renderList(); renderView();
        $$('.sources[data-ids="' + ids.join(",") + '"] .add-sel').forEach(function (b) { b.classList.add("done"); b.innerHTML = ICON.tick + "已加入選取"; });
        toast(fresh.length ? "已將 " + fresh.length + " 項來源加入選取。" : "這些來源都已經在選取清單中。");
      }
    });
    $("#composer").addEventListener("submit", function (e) {
      e.preventDefault(); var v = $("#askInput").value.trim(); if (!v || S.busy) return;
      $("#askInput").value = ""; ask(v, match(v));
    });
    $("#chatReset").addEventListener("click", function () { if (S.busy) return; renderWelcome(); });
  }

  /* ---------- view ---------- */
  function selectedItems() { return S.items.filter(function (i) { return S.sel.has(i.id); }); }
  function renderControls() {
    $("#roleGroup").innerHTML = D.ROLES.map(function (r) { return '<button role="radio" data-role="' + r.id + '" aria-checked="' + (S.role === r.id) + '">' + r.label + '</button>'; }).join("");
    $("#tplGroup").innerHTML = D.TEMPLATES.map(function (t) { return '<button class="tpl" role="radio" data-tpl="' + t.id + '" aria-checked="' + (S.tpl === t.id) + '" title="' + t.sub + '"><span class="th">' + TH[t.id] + '</span><span>' + t.label + '</span></button>'; }).join("");
    $("#roleNote").textContent = D.ROLES.filter(function (r) { return r.id === S.role; })[0].note;
  }
  function initView() {
    renderControls(); renderView();
    $("#roleGroup").addEventListener("click", function (e) {
      var b = e.target.closest("[data-role]"); if (!b) return;
      S.role = b.dataset.role; S.tpl = D.ROLES.filter(function (r) { return r.id === S.role; })[0].tpl; renderControls(); renderView(true);
    });
    $("#tplGroup").addEventListener("click", function (e) {
      var b = e.target.closest("[data-tpl]"); if (!b) return; S.tpl = b.dataset.tpl; renderControls(); renderView(true);
    });
    $("#view").addEventListener("click", function (e) {
      var z = e.target.closest("[data-zoom]"); if (z) { lightbox(z.dataset.zoom); return; }
      var h = e.target.closest("[data-reveal]"); if (h) { revealItem(h.dataset.reveal); return; }
      var s = e.target.closest("[data-sort]");
      if (s) { var k = s.dataset.sort; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : 1 }; renderView(); return; }
      var g = e.target.closest("[data-gotab]"); if (g) { goTab("archive"); }
      var qp = e.target.closest("[data-preset]"); if (qp) { var p = D.PRESETS[qp.dataset.preset]; p.ids.forEach(function (id) { S.sel.add(id); }); renderList(); renderView(); }
    });
  }
  function renderView(swap) {
    var items = selectedItems(), v = $("#view");
    $("#viewCount").textContent = items.length ? "已選取 " + items.length + " 項" : "";
    var box = $("#viewScroll");
    if (!items.length) {
      v.className = "view"; v.innerHTML = '<div class="empty-view"><div class="eicon">' + ICON.box + '</div><h3>還沒有選取任何資料</h3><p>請先在左側的資料庫勾選你需要的資料，或是在提問之後，把回答引用的來源加入選取。選好之後，這裡會依照你挑選的範本整理出來。</p>' +
        '<div class="quick"><span class="ql">快速開始：</span>' + D.PRESETS.map(function (p, i) { return '<button data-preset="' + i + '">' + p.label + '</button>'; }).join("") + '</div></div>';
      return;
    }
    v.className = "view"; if (swap) { void v.offsetWidth; }
    var fn = { moodboard: vMood, table: vTable, summary: vSummary, timeline: vTimeline }[S.tpl];
    v.innerHTML = fn(items);
    if (swap) { v.style.animation = "none"; void v.offsetWidth; v.style.animation = ""; box.scrollTop = 0; }
  }
  function vMood(items) {
    var tones = ["tone-a", "tone-b", "tone-c"];
    var imgs = items.filter(function (i) { return i.img; }), rest = items.filter(function (i) { return !i.img; });
    // interleave images with text tiles for a collage feel
    var order = [], ii = 0, ri = 0;
    while (ii < imgs.length || ri < rest.length) { if (ii < imgs.length) order.push(imgs[ii++]); if (ri < rest.length) order.push(rest[ri++]); if (ri < rest.length && ii >= imgs.length) order.push(rest[ri++]); }
    return '<div class="mood">' + order.map(function (it, k) {
      var cap = '<div class="cap"><b>' + it.title.replace(/^白板：|^錄音：/, "") + '</b>' + it.dept + "　" + it.type + '</div>';
      if (it.img) return '<div class="tile" data-zoom="assets/img/' + it.img + '"><img loading="lazy" alt="' + esc(it.title) + '" src="assets/img/' + it.img + '">' + cap + '</div>';
      var tone = tones[k % 3];
      if (it.type === "消費者訪談") return '<div class="tile ' + tone + '" data-reveal="' + it.id + '"><div class="body"><div class="serif">「' + it.quote + '」</div><div class="who">' + it.who + '</div></div></div>';
      if (it.stat) return '<div class="tile stat ' + tone + '" data-reveal="' + it.id + '"><div class="body"><div class="n">' + it.stat.n + '</div><div class="l">' + it.stat.l + '</div></div>' + cap + '</div>';
      if (it.ver) return '<div class="tile ver ' + tone + '" data-reveal="' + it.id + '"><div class="body"><div class="n">' + it.ver + '</div><div class="serif" style="margin-top:12px;font-size:13.5px">「' + it.quote + '」</div></div>' + cap + '</div>';
      if (it.type === "錄音") return '<div class="tile ' + tone + '" data-reveal="' + it.id + '"><div class="body"><div class="mwave">' + bars(it.id + "t", 26) + '</div><div class="serif" style="font-size:13.5px">「' + it.quote + '」</div></div>' + cap + '</div>';
      return '<div class="tile ' + tone + '" data-reveal="' + it.id + '"><div class="body"><div class="serif" style="font-size:13.5px">「' + it.quote + '」</div></div>' + cap + '</div>';
    }).join("") + '</div>';
  }
  function vTable(items) {
    var k = S.sort.key, d = S.sort.dir;
    var rows = items.slice().sort(function (a, b) { var x = a[k === "title" ? "title" : k], y = b[k]; return (x < y ? -1 : x > y ? 1 : (a.date < b.date ? -1 : 1)) * d; });
    function th(key, label) { return '<button data-sort="' + key + '" class="' + (S.sort.key === key ? "on" : "") + '">' + label + (S.sort.key === key ? (S.sort.dir > 0 ? " ↑" : " ↓") : "") + '</button>'; }
    return '<div class="tbl"><div class="tr-h"><span>資料與重點</span>' + th("type", "類型") + th("dept", "部門") + th("date", "日期") + '</div>' +
      rows.map(function (it) {
        return '<div class="tr-r" data-reveal="' + it.id + '"><div class="ttl"><div class="rt">' + it.title + '</div><div class="rp">' + it.point + '</div><div class="topics">' + it.topics.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("") + '</div></div>' +
          '<span class="rc">' + it.type + '</span><span class="rc">' + it.dept + '</span><span class="rc m">' + shortDate(it.date) + '</span></div>';
      }).join("") + '</div>';
  }
  function vSummary(items) {
    var stats = items.filter(function (i) { return i.stat; }).slice(0, 3);
    var pts = items.slice().sort(function (a, b) { return (a.date < b.date ? -1 : 1); });
    var max = 6, shown = pts.slice(0, max), more = pts.length - shown.length;
    var quotes = items.filter(function (i) { return i.who || (i.type === "錄音" && i.transcript); }).slice(0, 3);
    var depts = {}; items.forEach(function (i) { depts[i.dept] = 1; });
    var h = '<div class="sum"><div class="kicker">ONE-PAGE SUMMARY</div><h3>依據你挑選的 ' + items.length + ' 項資料，整理出以下重點。</h3><p class="basis">涵蓋 ' + Object.keys(depts).join("、") + ' 等部門的資料。</p>';
    if (stats.length) h += '<div class="stats">' + stats.map(function (s) { return '<div class="stat-c"><div class="n">' + s.stat.n + '</div><div class="l">' + s.stat.l + '</div></div>'; }).join("") + '</div>';
    h += '<div class="sec"><h4>重點結論</h4><ul>' + shown.map(function (i) { return '<li>' + i.point + '<button data-reveal="' + i.id + '">查看來源</button></li>'; }).join("") + '</ul>' + (more > 0 ? '<p class="faint" style="margin-top:12px;font-size:12px">另外還有 ' + more + ' 項資料，可以切換成資料表格查看完整內容。</p>' : "") + '</div>';
    if (quotes.length) h += '<div class="sec quotes"><h4>來自現場的聲音</h4>' + quotes.map(function (i) {
      var q = i.who ? i.quote : i.transcript[0][2], who = i.who || i.transcript[0][1];
      return '<blockquote>「' + q + '」<cite>' + who + '</cite></blockquote>';
    }).join("") + '</div>';
    return h + '</div>';
  }
  function vTimeline(items) {
    var ev = items.map(function (i) { return { date: i.date, item: i }; }).concat(D.MILESTONES.map(function (m) { return { date: m.date, ms: m }; }));
    ev.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ms ? 1 : -1); });
    return '<div class="tl">' + ev.map(function (e) {
      if (e.ms) return '<div class="tl-e ms"><div class="tl-date">' + fmtLong(e.date) + '</div><div class="tl-card"><div class="tt">' + e.ms.title + '</div><div class="tm">' + e.ms.note + '</div></div></div>';
      var i = e.item;
      return '<div class="tl-e"><div class="tl-date">' + fmtLong(i.date) + '</div><div class="tl-card" data-reveal="' + i.id + '"><div class="tt">' + i.title + '</div><div class="tm">' + i.dept + "　" + i.type + '</div><div class="tp">' + i.point + '</div>' + (i.img ? '<img loading="lazy" alt="" src="assets/img/' + i.img + '">' : "") + '</div></div>';
    }).join("") + '</div>';
  }

  /* ---------- nav ---------- */
  function initNav() {
    $("#tabbar").addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) goTab(b.dataset.go); });
  }

  initProject(); initArchive(); initAsk(); initView(); initNav();
  window.__pb = S;
})();
