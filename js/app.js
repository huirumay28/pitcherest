(function () {
  "use strict";
  var D = PB, Cm = D.common, $ = Cm.$, $$ = Cm.$$, esc = Cm.esc;

  var ICON = {
    check: '<svg viewBox="0 0 12 12"><path d="M2.5 6.2l2.4 2.4 4.6-5"/></svg>',
    chev: '<svg class="ico" viewBox="0 0 16 16"><path d="M4 6.5l4 4 4-4"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    spark: '<svg class="ico" viewBox="0 0 12 12" style="width:10px;height:10px;stroke:var(--gold)"><path d="M6 1.5v3M6 7.5v3M1.5 6h3M7.5 6h3"/></svg>',
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
    timeline: '<svg viewBox="0 0 40 30"><path d="M8 3v24"/><circle cx="8" cy="8" r="2"/><circle cx="8" cy="15" r="2"/><circle cx="8" cy="22" r="2"/><path d="M15 8h18M15 15h12M15 22h16"/></svg>',
    wall: '<svg viewBox="0 0 40 30"><rect x="3" y="3" width="34" height="14" rx="2"/><rect x="3" y="20" width="16" height="8" rx="2"/><rect x="22" y="20" width="15" height="8" rx="2"/></svg>',
    dash: '<svg viewBox="0 0 40 30"><rect x="3" y="3" width="16" height="9" rx="1.5"/><rect x="22" y="3" width="15" height="9" rx="1.5"/><path d="M3 18h22M3 23h30M3 28h14"/></svg>',
    base: '<svg viewBox="0 0 40 30"><path d="M3 5h10M3 11h34M3 17h10M3 23h34"/><circle cx="33" cy="5" r="2"/><circle cx="33" cy="17" r="2"/></svg>',
    quotes: '<svg viewBox="0 0 40 30"><path d="M6 14c0-4 2-6 5-7M6 14h6v7H6zM22 14c0-4 2-6 5-7M22 14h6v7h-6z"/></svg>',
    gallery: '<svg viewBox="0 0 40 30"><rect x="3" y="3" width="10" height="10" rx="1.5"/><rect x="15" y="3" width="10" height="10" rx="1.5"/><rect x="27" y="3" width="10" height="10" rx="1.5"/><rect x="3" y="16" width="10" height="10" rx="1.5"/><rect x="15" y="16" width="10" height="10" rx="1.5"/><rect x="27" y="16" width="10" height="10" rx="1.5"/></svg>'
  };
  var EXTCOL = { pptx: "#d93d7a", ppt: "#d93d7a", key: "#d93d7a", pdf: "#d93d7a", docx: "#16abe0", doc: "#16abe0", xlsx: "#00b0a3", csv: "#00b0a3", mp3: "#00b0a3", wav: "#00b0a3", m4a: "#00b0a3", url: "#9d833e", jpg: "#9d833e", png: "#9d833e" };

  /* ---------- state ---------- */
  var S = {
    base: D.ITEMS.slice(),
    up: Cm.loadUploads().map(function (i) { i._up = true; return i; }),
    sel: new Set(),
    f: { type: new Set(), dept: new Set(), topic: new Set(), mine: false },
    q: "",
    role: "strategy",
    tpl: "moodboard",
    sort: { key: "date", dir: 1 },
    open: new Set(),
    busy: false
  };
  function all() { return S.up.concat(S.base); }
  function byId(id) { return all().filter(function (i) { return i.id === id; })[0]; }
  function flagOf(it) { return it.flag || D.DEMO_FLAGS[it.id] || null; }
  function roleDept() { return D.ROLES.filter(function (r) { return r.id === S.role; })[0].dept; }
  function relevant(it) { var f = flagOf(it); return !!(f && f.depts.indexOf(roleDept()) >= 0); }
  function typeExt(it) { return it.ext || (it.type === "錄音" ? "mp3" : ""); }
  function hasVisual(it) { return !!it.img; }
  var isTabbed = function () { return window.matchMedia("(max-width:1179px)").matches; };
  function goTab(t) { document.body.dataset.tab = t; $$("#tabbar button").forEach(function (b) { b.classList.toggle("on", b.dataset.go === t); }); }
  var toast = Cm.toast;
  function lightbox(src) {
    var d = document.createElement("div"); d.className = "lightbox"; d.innerHTML = '<img alt="" src="' + src + '">';
    d.addEventListener("click", function () { d.remove(); }); document.body.appendChild(d);
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var l = $(".lightbox"); if (l) l.remove(); setFilterOpen(null); } });

  /* ---------- archive ---------- */
  function visibleItems() {
    var q = S.q.trim().toLowerCase();
    var list = all().filter(function (it) {
      if (S.f.type.size && !S.f.type.has(it.type)) return false;
      if (S.f.dept.size && !S.f.dept.has(it.dept)) return false;
      if (S.f.topic.size && !it.topics.some(function (t) { return S.f.topic.has(t); })) return false;
      if (S.f.mine && !relevant(it)) return false;
      if (q && (it.title + it.excerpt + it.type + it.dept + it.topics.join("") + (it.note || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (S.f.mine) { var pa = (flagOf(a) || {}).priority === "重要" ? 1 : 0, pb = (flagOf(b) || {}).priority === "重要" ? 1 : 0; if (pa !== pb) return pb - pa; }
      var na = a._up ? a.created || 0 : 0, nb = b._up ? b.created || 0 : 0; if (na !== nb && !S.f.mine) return nb - na;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
    return list;
  }
  function rightThumb(it) {
    if (it.img) return '<img class="thumb" loading="lazy" alt="" src="' + Cm.thumb(it.img) + '">';
    if (it.type === "錄音") return '<div class="vmini">' + Cm.bars(it.id + "m", 12) + '</div>';
    var ext = it.ext || ""; if (ext) return '<div class="extb" style="color:' + (EXTCOL[ext] || "#7c7c86") + '">' + esc(ext === "url" ? "web" : ext) + '</div>';
    return "";
  }
  function itemHTML(it) {
    var sel = S.sel.has(it.id), open = S.open.has(it.id), f = flagOf(it), mine = relevant(it);
    var flags = f ? '<div class="flags"><span class="fl">' + f.depts.map(function (d) { return '<span class="fl">' + Cm.deptDot(d) + d + '</span>'; }).join("") + '</span></div>' : "";
    var imp = f && f.priority === "重要" ? '<span class="tag imp">重要</span>' : "";
    var isNew = it._up ? '<span class="tag new">新加入</span>' : "";
    var mineTag = mine ? '<span class="tag mine">與我相關</span>' : "";
    return '<li class="item' + (sel ? " sel" : "") + (open ? " open" : "") + '" data-id="' + it.id + '">' +
      '<div class="item-row" data-act="open"><button class="cb" data-act="sel" role="checkbox" aria-checked="' + sel + '" aria-label="選取「' + esc(it.title) + '」">' + ICON.check + '</button>' +
      '<div class="item-main"><div class="item-title">' + esc(it.title) + '</div>' +
      '<div class="item-meta"><span>' + it.type + '</span><span class="dot"></span><span class="dept">' + Cm.deptDot(it.dept) + it.dept + '</span><span class="dot"></span><span>' + Cm.fmtDate(it.date) + '</span></div>' +
      '<div class="tags">' + isNew + imp + mineTag + it.topics.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("") + '<span class="auto" title="由系統自動判斷類型、部門與主題">' + ICON.spark + '自動分類</span></div>' +
      flags + (it.note ? '<div class="note-line"><b>備註</b>' + esc(it.note) + '</div>' : "") + '</div>' + rightThumb(it) + '</div>' +
      '<div class="item-detail">' + detailHTML(it) + '</div></li>';
  }
  function detailHTML(it) {
    var h = "";
    if (it.img) h += '<img class="big" loading="lazy" alt="' + esc(it.title) + '" data-act="zoom" src="' + Cm.full(it.img) + '">';
    if (it.type === "錄音") {
      h += '<div class="wave"><button class="play" data-act="play" aria-label="播放示意">' + ICON.play + '</button><div class="bars" data-id="' + it.id + '">' + Cm.bars(it.id, 64) + '</div><span class="dur">' + (it.dur || "00:00") + '</span></div>';
      if (it.transcript) h += '<div class="tr">' + it.transcript.map(function (t) { return '<p><span class="tm">' + t[0] + "　" + t[1] + '</span>' + t[2] + '</p>'; }).join("") + '</div>';
    } else if (it.type === "消費者訪談") h += '<div class="quote-q">' + esc(it.excerpt) + '</div>';
    else if (it.ext === "url") {
      h += '<div class="linkcard"><div class="fav" style="background:' + EXTCOL.url + '">' + esc((Cm.domainOf(it.url || "") || "W").charAt(0).toUpperCase()) + '</div><div><div class="lt">' + esc(it.title) + '</div><div class="ld">' + esc(Cm.domainOf(it.url || "")) + '</div></div></div><p class="ex">' + esc(it.excerpt) + '</p>';
    } else h += '<p class="ex">' + esc(it.excerpt) + '</p>';
    if (it.note) h += '<div class="notebox"><b>上傳者備註</b>' + esc(it.note) + '</div>';
    var f = flagOf(it);
    if (f) h += '<div class="flagbox">建議查看：' + f.depts.map(function (d) { return '<span class="fl">' + Cm.deptDot(d) + d + '</span>'; }).join("") + (f.people && f.people.length ? '<br>指定同事：' + esc(f.people.join("、")) : "") + (f.priority === "重要" ? '<br>優先程度：重要' : "") + (f.reason ? '<br>原因：' + esc(f.reason) : "") + '</div>';
    return h;
  }
  function renderList() {
    var list = visibleItems(), ul = $("#items"), total = all().length;
    $("#archiveCount").textContent = list.length === total ? "共 " + total + " 項" : "顯示 " + list.length + " / " + total + " 項";
    ul.innerHTML = list.length ? list.map(itemHTML).join("") : '<li class="empty-list">找不到符合條件的資料。<br><button class="link" data-act="clearf">清除所有篩選</button></li>';
    renderQuick(); renderSelbar();
    $("#resetWrap").hidden = !S.up.length;
  }
  function renderQuick() {
    $("#quick").innerHTML = '<span>挑選：</span>' + D.PRESETS.map(function (p, i) { return '<button data-preset="' + i + '">' + p.label + '</button>'; }).join("") + '<button data-act="all">全選目前結果</button>';
  }
  function renderSelbar() {
    var n = S.sel.size, bar = $("#selbar"); bar.hidden = n === 0; $("#selCount").textContent = "已選取 " + n + " 項";
    var b = $("#tabBadge"); b.hidden = n === 0; b.textContent = n;
  }
  function counts(key) {
    var c = {}; all().forEach(function (it) { (key === "topic" ? it.topics : [it[key]]).forEach(function (v) { c[v] = (c[v] || 0) + 1; }); }); return c;
  }
  var FNAMES = { type: "類型", dept: "部門", topic: "主題" };
  var openFilter = null;
  function anyFilter() { return S.f.type.size + S.f.dept.size + S.f.topic.size + (S.f.mine ? 1 : 0); }
  function clearFilters() { S.f = { type: new Set(), dept: new Set(), topic: new Set(), mine: false }; S.q = ""; $("#searchInput").value = ""; }
  function renderFilters(openKey) {
    var box = $("#filters"), html = "";
    ["type", "dept", "topic"].forEach(function (k) {
      var n = S.f[k].size;
      html += '<button class="fbtn' + (n ? " on" : "") + '" data-f="' + k + '" aria-haspopup="true" aria-expanded="' + (openKey === k) + '">' + FNAMES[k] + (n ? " · " + n : "") + ICON.chev + '</button>';
    });
    html += '<button class="fbtn rel' + (S.f.mine ? " on" : "") + '" data-mine="1" aria-pressed="' + S.f.mine + '" title="依照右側選擇的身分，只顯示與你相關的資料">' + Cm.deptDot(roleDept()) + '與我相關</button>';
    if (anyFilter()) html += '<button class="link" data-act="clearf" style="margin-left:6px">清除</button>';
    if (openKey) {
      var list = openKey === "type" ? D.TYPES : openKey === "dept" ? D.DEPTS : D.TOPICS, c = counts(openKey);
      Object.keys(c).forEach(function (k) { if (list.indexOf(k) < 0) list.push(k); });
      html += '<div class="popover fpop" data-pop="' + openKey + '">' + list.map(function (v) {
        return '<label><input type="checkbox" data-fv="' + v + '"' + (S.f[openKey].has(v) ? " checked" : "") + '>' + (openKey === "dept" ? Cm.deptDot(v) : "") + '<span>' + v + '</span><span class="n">' + (c[v] || 0) + '</span></label>';
      }).join("") + '</div>';
    }
    box.innerHTML = html;
  }
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
    if (!visibleItems().some(function (i) { return i.id === id; })) { clearFilters(); renderFilters(); }
    S.open.add(id); renderList();
    if (isTabbed()) goTab("archive");
    var li = $('.item[data-id="' + id + '"]');
    if (li) { $("#listScroll").scrollTo({ top: li.offsetTop - 12, behavior: "smooth" }); li.classList.remove("hl"); void li.offsetWidth; li.classList.add("hl"); }
  }
  var playT = null;
  function playDemo(li) {
    var btn = $(".play", li), bs = $$(".bars i", li);
    if (playT) { clearInterval(playT); playT = null; if (btn.dataset.on) { btn.dataset.on = ""; btn.innerHTML = ICON.play; bs.forEach(function (b) { b.classList.remove("p"); }); return; } }
    $$(".play").forEach(function (b) { b.dataset.on = ""; b.innerHTML = ICON.play; });
    btn.dataset.on = "1"; btn.innerHTML = ICON.pause; var i = 0; bs.forEach(function (b) { b.classList.remove("p"); });
    playT = setInterval(function () { if (i < bs.length) bs[i++].classList.add("p"); else { clearInterval(playT); playT = null; btn.dataset.on = ""; btn.innerHTML = ICON.play; } }, 110);
  }

  function initArchive() {
    renderFilters(); renderList();
    $("#searchInput").addEventListener("input", function (e) { S.q = e.target.value; renderList(); });
    $("#filters").addEventListener("click", function (e) {
      e.stopPropagation();
      var b = e.target.closest("[data-f]"); if (b) { setFilterOpen(openFilter === b.dataset.f ? null : b.dataset.f); return; }
      if (e.target.closest("[data-mine]")) { S.f.mine = !S.f.mine; openFilter = null; renderFilters(); renderList(); return; }
      if (e.target.closest('[data-act="clearf"]')) { clearFilters(); setFilterOpen(null); renderList(); }
    });
    $("#filters").addEventListener("change", function (e) {
      var v = e.target.dataset.fv; if (v == null) return; var k = openFilter;
      if (e.target.checked) S.f[k].add(v); else S.f[k].delete(v);
      var sc = $(".fpop") ? $(".fpop").scrollTop : 0; renderFilters(k); if ($(".fpop")) $(".fpop").scrollTop = sc; renderList();
    });
    document.addEventListener("click", function (e) { if (openFilter && !e.target.closest(".fpop")) setFilterOpen(null); });
    $("#quick").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.preset != null) { var p = D.PRESETS[b.dataset.preset]; p.ids.forEach(function (id) { S.sel.add(id); }); renderList(); renderView(); toast("已選取「" + p.label + "」相關的 " + p.ids.length + " 項資料。"); }
      else if (b.dataset.act === "all") { var l = visibleItems(); l.forEach(function (i) { S.sel.add(i.id); }); renderList(); renderView(); toast("已選取目前列表中的 " + l.length + " 項資料。"); }
    });
    $("#items").addEventListener("click", function (e) {
      var li = e.target.closest(".item");
      if (!li) { if (e.target.closest('[data-act="clearf"]')) { clearFilters(); renderFilters(); renderList(); } return; }
      var id = li.dataset.id, a = e.target.closest("[data-act]"), act = a ? a.dataset.act : null;
      if (act === "sel") { e.stopPropagation(); toggleSel(id); return; }
      if (act === "zoom") { lightbox($("img.big", li).src); return; }
      if (act === "play") { playDemo(li); return; }
      if (e.target.closest(".item-detail")) return;
      if (S.open.has(id)) { S.open.delete(id); li.classList.remove("open"); } else { S.open.add(id); li.classList.add("open"); }
    });
    $("#selClear").addEventListener("click", function () { S.sel.clear(); renderList(); renderView(); });
    $("#goView").addEventListener("click", function () { goTab("view"); });
    $("#resetUploads").addEventListener("click", function () { Cm.clearUploads(); S.up = []; S.up.forEach(function () {}); S.sel.forEach(function (id) { if (/^u-/.test(id)) S.sel.delete(id); }); renderList(); renderView(); initWelcome(); toast("已移除你上傳的示範資料。"); });
  }

  /* ---------- ask ---------- */
  function citeHTML(id, map) {
    var it = byId(id); if (!it) return ""; if (!map[id]) map[id] = ++map._n;
    return '<button class="cite" data-cite="' + id + '" data-tip="' + esc(it.title) + '" aria-label="來源 ' + map[id] + "：" + esc(it.title) + '">' + map[id] + '</button>';
  }
  function answerHTML(blocks, upto, map) {
    var left = upto, out = "";
    function take(s) {
      var res = "", parts = s.split(/(\s?\[\[[\w-]+\]\])/);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (/\[\[/.test(p)) { if (left >= 0) res += p.replace(/\s?\[\[([\w-]+)\]\]/, function (_, id) { return citeHTML(id, map); }); continue; }
        if (left <= 0) { left = -1; break; }
        if (p.length <= left) { res += esc(p); left -= p.length; } else { res += esc(p.slice(0, left)); left = -1; break; }
      }
      return res;
    }
    for (var b = 0; b < blocks.length; b++) {
      if (left < 0) break; var blk = blocks[b];
      if (blk.t === "p") out += "<p>" + take(blk.s) + "</p>";
      else { out += "<ul>"; for (var j = 0; j < blk.items.length && left >= 0; j++) out += "<li>" + take(blk.items[j]) + "</li>"; out += "</ul>"; }
    }
    return out;
  }
  function scrollChat() { var c = $("#chatScroll"); c.scrollTo({ top: c.scrollHeight, behavior: "smooth" }); }
  function initWelcome() {
    var hot = S.up.length ? '<button class="hot" data-text="我剛上傳的資料是什麼？"><span>我剛上傳的資料是什麼？</span>' + ICON.arrow + '</button>' : "";
    $("#chat").innerHTML = '<div class="welcome"><h1>你可以直接問這個資料庫任何問題。</h1>' +
      '<p class="sub">所有回答都只根據這場比稿已經放進資料庫的內容，每一句話也都會附上來源，讓你可以回頭確認原始資料。</p>' +
      '<div class="suggest-label">試試看這些問題</div><div class="suggest">' + hot +
      D.QA.map(function (q) { return '<button data-q="' + q.id + '"><span>' + q.q + '</span>' + ICON.arrow + '</button>'; }).join("") + '</div></div>';
    $("#chatReset").hidden = true;
  }
  function addQuestion(text) {
    var w = $(".welcome"); if (w) w.remove();
    var d = document.createElement("div"); d.className = "msg-q"; var s = document.createElement("span"); s.textContent = text; d.appendChild(s); $("#chat").appendChild(d);
    $("#chatReset").hidden = false; scrollChat();
  }
  function selectedItems() { return all().filter(function (i) { return S.sel.has(i.id); }); }
  function ask(text) {
    if (S.busy) return; S.busy = true; addQuestion(text);
    var a = document.createElement("div"); a.className = "msg-a";
    a.innerHTML = '<div class="label">' + ICON.spark + 'PITCHEREST</div><div class="answer"><div class="thinking"><i></i><i></i><i></i></div></div>';
    $("#chat").appendChild(a); scrollChat();
    var ans = $(".answer", a), t0 = Date.now();
    askBrain(text, selectedItems()).then(function (res) {
      var wait = Math.max(0, 750 - (Date.now() - t0));
      setTimeout(function () {
        if (!res.matched) return finishFallback(a, ans, res);
        var total = askBrain.plainLen(res.blocks), n = 0, skip = false;
        ans.onclick = function () { skip = true; };
        (function tick() {
          n = skip ? total : Math.min(total, n + 3);
          ans.innerHTML = answerHTML(res.blocks, n, { _n: 0 });
          if (n % 30 === 0 || n >= total) scrollChat();
          if (n < total) return setTimeout(tick, 24);
          ans.onclick = null; finishAnswer(a, res);
        })();
      }, wait);
    });
  }
  function finishAnswer(a, res) {
    var ids = askBrain.citedIds(res.blocks), map = { _n: 0 };
    $(".answer", a).innerHTML = answerHTML(res.blocks, 99999, map);
    var allSel = ids.every(function (id) { return S.sel.has(id); });
    var src = document.createElement("div"); src.className = "sources"; src.dataset.ids = ids.join(",");
    src.innerHTML = '<div class="sh"><span>來源　' + ids.length + ' 項</span><button class="add-sel' + (allSel ? " done" : "") + '" data-act="addsel">' + (allSel ? ICON.tick + "已加入選取" : ICON.plus + "將這些來源加入選取") + '</button></div>' +
      ids.map(function (id) {
        var it = byId(id), th = it.img ? '<img class="sth" alt="" src="' + Cm.thumb(it.img) + '">' : '<span class="sth x">' + esc((it.ext || it.type).slice(0, 4)) + '</span>';
        return '<button class="src" data-cite="' + id + '"><span class="num">' + map[id] + '</span>' + th + '<span class="st">' + esc(it.title) + '</span><span class="sm">' + it.type + '</span></button>';
      }).join("");
    a.appendChild(src);
    var f = document.createElement("div"); f.className = "follow";
    f.innerHTML = res.next.slice(0, 3).map(function (id) { return '<button class="chip" data-q="' + id + '">' + D.QA.filter(function (q) { return q.id === id; })[0].q + '</button>'; }).join("");
    a.appendChild(f); S.busy = false; scrollChat();
  }
  function finishFallback(a, ans, res) {
    ans.className = "answer fallback";
    ans.innerHTML = '<p>這個示範版本目前只能回答下方的建議問題，還沒有辦法處理其他內容。你可以直接點選下面的任一問題試試看；正式版本則可以針對整個資料庫自由提問。</p>';
    var f = document.createElement("div"); f.className = "follow";
    f.innerHTML = D.QA.map(function (q) { return '<button class="chip" data-q="' + q.id + '">' + q.q + '</button>'; }).join("");
    a.appendChild(f); S.busy = false; scrollChat();
  }
  function initAsk() {
    initWelcome();
    $("#chat").addEventListener("click", function (e) {
      var q = e.target.closest("[data-q]");
      if (q) { ask(D.QA.filter(function (x) { return x.id === q.dataset.q; })[0].q); return; }
      var t = e.target.closest("[data-text]"); if (t) { ask(t.dataset.text); return; }
      var c = e.target.closest("[data-cite]"); if (c) { revealItem(c.dataset.cite); return; }
      var add = e.target.closest('[data-act="addsel"]');
      if (add) {
        var ids = add.closest(".sources").dataset.ids.split(","), fresh = ids.filter(function (id) { return !S.sel.has(id); });
        ids.forEach(function (id) { S.sel.add(id); }); renderList(); renderView();
        $$('.sources[data-ids="' + ids.join(",") + '"] .add-sel').forEach(function (b) { b.classList.add("done"); b.innerHTML = ICON.tick + "已加入選取"; });
        toast(fresh.length ? "已將 " + fresh.length + " 項來源加入選取。" : "這些來源都已經在選取清單中。");
      }
    });
    $("#composer").addEventListener("submit", function (e) { e.preventDefault(); var v = $("#askInput").value.trim(); if (!v || S.busy) return; $("#askInput").value = ""; ask(v); });
    $("#chatReset").addEventListener("click", function () { if (!S.busy) initWelcome(); });
  }

  /* ---------- view ---------- */
  function recTpl() { return D.ROLES.filter(function (r) { return r.id === S.role; })[0].tpl; }
  function tplBtn(t) {
    var rec = recTpl() === t.id;
    return '<button class="tpl" role="radio" data-tpl="' + t.id + '" aria-checked="' + (S.tpl === t.id) + '" title="' + t.sub + '"><span class="th">' + TH[t.id] + '</span><span>' + t.label + '</span>' + (rec ? '<span class="rec">建議</span>' : "") + '</button>';
  }
  function renderControls() {
    var groups = ["基本", "依角色", "更多玩法"], h = "";
    groups.forEach(function (g) {
      var list = D.TEMPLATES.filter(function (t) { return t.group === g; });
      h += '<div class="grp"><div class="grp-h">' + g + '</div><div class="tpls' + (list.length < 4 ? " three" : "") + '" role="radiogroup" aria-label="' + g + ' VIEW">' + list.map(tplBtn).join("") + '</div></div>';
    });
    var role = D.ROLES.filter(function (r) { return r.id === S.role; })[0];
    h += '<div class="rolebar"><span class="rl">建議 VIEW</span><div class="role" role="radiogroup" aria-label="選擇你的角色">' +
      D.ROLES.map(function (r) { return '<button role="radio" data-role="' + r.id + '" aria-checked="' + (S.role === r.id) + '">' + Cm.deptDot(r.dept) + r.label + '</button>'; }).join("") + '</div>' +
      (S.tpl !== role.tpl ? '<button class="apply" data-apply="1">套用建議</button>' : "") +
      '<p class="role-note">依你的角色推薦適合的樣板，你仍可隨時自行切換。' + role.note + '</p></div>';
    $("#viewControls").innerHTML = h;
  }
  function initView() {
    renderControls(); renderView();
    $("#viewControls").addEventListener("click", function (e) {
      var b = e.target.closest("[data-role]");
      if (b) { S.role = b.dataset.role; renderControls(); renderFilters(openFilter); renderList(); return; }
      if (e.target.closest("[data-apply]")) { S.tpl = recTpl(); renderControls(); renderView(true); return; }
      var t = e.target.closest("[data-tpl]"); if (t) { S.tpl = t.dataset.tpl; renderControls(); renderView(true); }
    });
    $("#view").addEventListener("click", function (e) {
      var z = e.target.closest("[data-zoom]"); if (z) { lightbox(z.dataset.zoom); return; }
      var h = e.target.closest("[data-reveal]"); if (h) { revealItem(h.dataset.reveal); return; }
      var s = e.target.closest("[data-sort]"); if (s) { var k = s.dataset.sort; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : 1 }; renderView(); return; }
      var qp = e.target.closest("[data-preset]"); if (qp) { D.PRESETS[qp.dataset.preset].ids.forEach(function (id) { S.sel.add(id); }); renderList(); renderView(); }
    });
  }
  var FN = { moodboard: vMood, table: vTable, summary: vSummary, timeline: vTimeline, wall: vWall, dash: vDash, base: vBase, quotes: vQuotes, gallery: vGallery };
  function renderView(swap) {
    var items = selectedItems(), v = $("#view");
    $("#viewCount").textContent = items.length ? "已選取 " + items.length + " 項" : "";
    if (!items.length) {
      v.innerHTML = '<div class="empty-view"><div class="eicon">' + ICON.box + '</div><h3>還沒有選取任何資料</h3><p>請先在左側的資料庫勾選你需要的資料，或是在提問之後，把回答引用的來源加入選取。選好之後，這裡會依照你選擇的 VIEW 整理出來。</p>' +
        '<div class="quick"><span>快速開始：</span>' + D.PRESETS.map(function (p, i) { return '<button data-preset="' + i + '">' + p.label + '</button>'; }).join("") + '</div></div>';
      return;
    }
    v.innerHTML = FN[S.tpl](items);
    if (swap) { v.style.animation = "none"; void v.offsetWidth; v.style.animation = ""; }
  }
  function quoteOf(i) { return i.who ? i.quote : (i.type === "錄音" && i.transcript ? i.transcript[0][2] : i.quote); }
  function tones(k) { return "t" + (k % 4); }
  function vMood(items) {
    var imgs = items.filter(hasVisual), rest = items.filter(function (i) { return !hasVisual(i); }), order = [], ii = 0, ri = 0;
    while (ii < imgs.length || ri < rest.length) { var n = 0; while (n < 2 && ii < imgs.length) { order.push(imgs[ii++]); n++; } if (ri < rest.length) order.push(rest[ri++]); }
    return '<div class="mood">' + order.map(function (it, k) {
      var cap = '<div class="cap"><b>' + esc(it.title.replace(/^白板：|^錄音：/, "")) + '</b><span class="cd">' + Cm.deptDot(it.dept) + it.dept + "　" + it.type + '</span></div>';
      if (it.img) return '<div class="tile" data-zoom="' + Cm.full(it.img) + '"><img loading="lazy" alt="' + esc(it.title) + '" src="' + Cm.full(it.img) + '">' + cap + '</div>';
      var tn = tones(k);
      if (it.stat) return '<div class="tile stat ' + tn + '" data-reveal="' + it.id + '"><div class="body"><div class="n">' + it.stat.n + '</div><div class="l">' + it.stat.l + '</div></div>' + cap + '</div>';
      if (it.ver) return '<div class="tile ver ' + tn + '" data-reveal="' + it.id + '"><div class="body"><div class="n">' + it.ver + '</div><div class="serif" style="margin-top:12px;font-size:13.5px">「' + esc(it.quote) + '」</div></div>' + cap + '</div>';
      if (it.type === "錄音") return '<div class="tile ' + tn + '" data-reveal="' + it.id + '"><div class="body"><div class="mwave">' + Cm.bars(it.id + "t", 26) + '</div><div class="serif" style="font-size:13.5px">「' + esc(it.quote) + '」</div></div>' + cap + '</div>';
      if (it.ext) return '<div class="tile ' + tn + '" data-reveal="' + it.id + '"><div class="extbig" style="color:' + (EXTCOL[it.ext] || "#7c7c86") + '">' + esc(it.ext === "url" ? "web" : it.ext) + '</div><div class="body" style="padding-top:0"><div class="serif" style="font-size:13px">' + esc(it.point) + '</div></div>' + cap + '</div>';
      return '<div class="tile ' + tn + '" data-reveal="' + it.id + '"><div class="body"><div class="serif" style="font-size:13.5px">「' + esc(it.quote) + '」</div>' + (it.who ? '<div class="who">' + esc(it.who) + '</div>' : "") + '</div>' + cap + '</div>';
    }).join("") + '</div>';
  }
  function vTable(items) {
    var k = S.sort.key, d = S.sort.dir;
    var rows = items.slice().sort(function (a, b) { var x = a[k], y = b[k]; return (x < y ? -1 : x > y ? 1 : (a.date < b.date ? -1 : 1)) * d; });
    function th(key, label) { return '<button data-sort="' + key + '" class="' + (S.sort.key === key ? "on" : "") + '">' + label + (S.sort.key === key ? (S.sort.dir > 0 ? " ↑" : " ↓") : "") + '</button>'; }
    return '<div class="tbl"><div class="tr-h"><span>資料與重點</span>' + th("type", "類型") + th("dept", "部門") + th("date", "日期") + '</div>' +
      rows.map(function (it) {
        var thb = it.img ? '<img class="rth" loading="lazy" alt="" src="' + Cm.thumb(it.img) + '">' : '<span class="rth x" style="color:' + (EXTCOL[typeExt(it)] || "#a4a4ac") + '">' + esc((typeExt(it) || it.type.slice(0, 2))) + '</span>';
        return '<div class="tr-r" data-reveal="' + it.id + '"><div class="ttl">' + thb + '<div><div class="rt">' + esc(it.title) + '</div><div class="rp">' + esc(it.point) + '</div>' +
          '<div class="topics">' + it.topics.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("") + '</div>' + (it.note ? '<div class="rnote">備註：' + esc(it.note) + '</div>' : "") + '</div></div>' +
          '<span class="rc">' + it.type + '</span><span class="rc dp">' + Cm.deptDot(it.dept) + it.dept + '</span><span class="rc m">' + Cm.shortDate(it.date) + '</span></div>';
      }).join("") + '</div>';
  }
  function deptsOf(items) { var o = {}; items.forEach(function (i) { o[i.dept] = 1; }); return D.DEPTS.filter(function (d) { return o[d]; }); }
  function vSummary(items) {
    var stats = items.filter(function (i) { return i.stat; }).slice(0, 3), pts = items.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var shown = pts.slice(0, 6), more = pts.length - shown.length;
    var quotes = items.filter(function (i) { return i.who || (i.type === "錄音" && i.transcript); }).slice(0, 3);
    var imgs = items.filter(hasVisual).slice(0, 4);
    var h = '<div class="sum"><div class="kicker">ONE-PAGE SUMMARY</div><h3>依據你挑選的 ' + items.length + ' 項資料，整理出以下重點。</h3><p class="basis">涵蓋 ' + deptsOf(items).map(function (d) { return '<span>' + Cm.deptDot(d) + d + '</span>'; }).join("") + ' 的資料</p>';
    if (imgs.length) h += '<div class="strip">' + imgs.map(function (i) { return '<img loading="lazy" alt="" data-zoom="' + Cm.full(i.img) + '" src="' + Cm.thumb(i.img) + '">'; }).join("") + '</div>';
    if (stats.length) h += '<div class="stats">' + stats.map(function (s) { return '<div class="stat-c"><div class="n">' + s.stat.n + '</div><div class="l">' + s.stat.l + '</div></div>'; }).join("") + '</div>';
    h += '<div class="sec"><h4>重點結論</h4><ul>' + shown.map(function (i) { return '<li>' + esc(i.point) + '<button data-reveal="' + i.id + '">查看來源</button></li>'; }).join("") + '</ul>' + (more > 0 ? '<p class="faint" style="margin-top:12px;font-size:12px">另外還有 ' + more + ' 項資料，可以切換成 Data VIEW 查看完整內容。</p>' : "") + '</div>';
    if (quotes.length) h += '<div class="sec quotes"><h4>來自現場的聲音</h4>' + quotes.map(function (i) { var q = i.who ? i.quote : i.transcript[0][2], who = i.who || i.transcript[0][1]; return '<blockquote>「' + esc(q) + '」<cite>' + esc(who) + '</cite></blockquote>'; }).join("") + '</div>';
    return h + '</div>';
  }
  function vTimeline(items) {
    var ev = items.map(function (i) { return { date: i.date, item: i }; }).concat(D.MILESTONES.map(function (m) { return { date: m.date, ms: m }; }));
    ev.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ms ? 1 : -1); });
    return '<div class="tl">' + ev.map(function (e) {
      if (e.ms) return '<div class="tl-e ms"><div class="tl-date">' + Cm.fmtLong(e.date) + '</div><div class="tl-card"><div class="tt">' + e.ms.title + '</div><div class="tm">' + e.ms.note + '</div></div></div>';
      var i = e.item;
      return '<div class="tl-e"><div class="tl-date">' + Cm.fmtLong(i.date) + '</div><div class="tl-card" data-reveal="' + i.id + '"><div class="tt">' + esc(i.title) + '</div><div class="tm">' + Cm.deptDot(i.dept) + i.dept + "　" + i.type + '</div><div class="tp">' + esc(i.point) + '</div>' + (i.img ? '<img loading="lazy" alt="" src="' + Cm.thumb(i.img) + '">' : "") + '</div></div>';
    }).join("") + '</div>';
  }
  function vWall(items) {
    var imgs = items.filter(hasVisual), qs = items.filter(function (i) { return !hasVisual(i) && (i.who || i.quote); });
    if (!imgs.length && !qs.length) return '<div class="empty-view" style="min-height:240px"><p>選取的資料中沒有圖片，請加入一些視覺素材，或改用其他 VIEW。</p></div>';
    var out = [], qi = 0;
    imgs.forEach(function (i, k) {
      out.push('<div class="w' + (k % 3 === 0 ? " big" : "") + '" data-zoom="' + Cm.full(i.img) + '" style="' + (k % 3 === 0 ? "aspect-ratio:16/9" : "aspect-ratio:1/1") + '"><img loading="lazy" alt="" src="' + Cm.full(i.img) + '"><div class="ov">' + esc(i.quote) + '</div></div>');
      if (k % 3 === 2 && qi < qs.length) { var q = qs[qi++]; out.push('<div class="w q" data-reveal="' + q.id + '"><div class="serif">「' + esc(quoteOf(q)) + '」</div><small>' + esc(q.who || q.title) + '</small></div>'); }
    });
    while (qi < qs.length) { var q2 = qs[qi++]; out.push('<div class="w q" data-reveal="' + q2.id + '"><div class="serif">「' + esc(quoteOf(q2)) + '」</div><small>' + esc(q2.who || q2.title) + '</small></div>'); }
    return '<div class="wall">' + out.join("") + '</div>';
  }
  function vDash(items) {
    var stats = items.filter(function (i) { return i.stat; }).slice(0, 4);
    var byType = {}, byDept = {}; items.forEach(function (i) { byType[i.type] = (byType[i.type] || 0) + 1; byDept[i.dept] = (byDept[i.dept] || 0) + 1; });
    var max = items.length;
    function dist(title, obj, colorFn) {
      return '<div class="dist"><div class="sec" style="margin-top:0"><h4>' + title + '</h4></div>' + Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).map(function (k) { return '<div class="dr"><span>' + k + '</span><div class="bar"><i style="width:' + Math.round(obj[k] / max * 100) + '%;background:' + colorFn(k) + '"></i></div><span class="v">' + obj[k] + '</span></div>'; }).join("") + '</div>';
    }
    var cols = ["#9d833e", "#16abe0", "#00b0a3", "#d93d7a"], ci = 0;
    var h = '<div class="dash-stats">' + [{ n: items.length, l: "項已選取的資料" }, { n: items.filter(hasVisual).length, l: "項含有圖片的資料" }].concat(stats.map(function (s) { return s.stat; })).slice(0, 4).map(function (s) { return '<div class="dstat"><div class="n">' + s.n + '</div><div class="l">' + s.l + '</div></div>'; }).join("") + '</div>';
    h += dist("依部門", byDept, function (k) { return D.DEPT_COLOR[k]; }) + dist("依類型", byType, function () { return cols[ci++ % 4]; });
    var rows = items.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    h += '<div class="dense"><div class="sec" style="margin-top:0"><h4>完整清單</h4></div>' + rows.map(function (i) { return '<div class="r" data-reveal="' + i.id + '"><div class="t">' + Cm.deptDot(i.dept) + '<span>' + esc(i.title) + '</span></div><div class="m">' + i.type + '　' + Cm.shortDate(i.date) + '</div></div>'; }).join("") + '</div>';
    return h;
  }
  function vBase(items) {
    return '<div class="base">' + D.DEPTS.map(function (d) {
      var l = items.filter(function (i) { return i.dept === d; }); if (!l.length) return "";
      return '<div class="bg"><div class="bh"><span class="bl" style="background:' + D.DEPT_COLOR[d] + '"></span>' + d + '<small>' + l.length + ' 項</small></div>' + l.map(function (i) {
        return '<div class="bi" data-reveal="' + i.id + '"><div><div class="bt">' + esc(i.title) + '</div><div class="bp">' + esc(i.point) + '</div></div>' + (i.img ? '<img loading="lazy" alt="" src="' + Cm.thumb(i.img) + '">' : "") + '</div>';
      }).join("") + '</div>';
    }).join("") + '</div>';
  }
  function vQuotes(items) {
    var qs = items.filter(function (i) { return i.quote; });
    return '<div class="sum"><div class="kicker">QUOTES</div><h3>把重要的話，收集成一面牆。</h3><div class="sec quotes" style="margin-top:8px">' + qs.map(function (i) { return '<blockquote data-reveal="' + i.id + '" style="cursor:pointer">「' + esc(quoteOf(i)) + '」<cite>' + esc(i.who || i.title) + '</cite></blockquote>'; }).join("") + '</div></div>';
  }
  function vGallery(items) {
    var imgs = items.filter(hasVisual);
    if (!imgs.length) return '<div class="empty-view" style="min-height:240px"><p>選取的資料中沒有圖片，請加入一些視覺素材，或改用其他 VIEW。</p></div>';
    return '<div class="wall" style="grid-template-columns:repeat(3,1fr);gap:8px">' + imgs.map(function (i) { return '<div class="w" style="aspect-ratio:1/1" data-zoom="' + Cm.full(i.img) + '"><img loading="lazy" alt="' + esc(i.title) + '" src="' + Cm.thumb(i.img) + '"></div>'; }).join("") + '</div>';
  }

  /* ---------- init ---------- */
  $("#tabbar").addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) goTab(b.dataset.go); });
  initArchive(); initAsk(); initView();
  var m = /new=([\w-]+)/.exec(location.hash);
  if (m) { setTimeout(function () { revealItem(m[1]); toast("已加入資料庫，你可以在這裡看到剛上傳的資料。"); }, 300); }
  window.__pb = S;
})();
