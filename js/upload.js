(function () {
  "use strict";
  var D = PB, Cm = D.common, $ = Cm.$, $$ = Cm.$$, esc = Cm.esc;
  var EXTCOL = { pptx: "#d93d7a", ppt: "#d93d7a", key: "#d93d7a", pdf: "#d93d7a", docx: "#16abe0", doc: "#16abe0", xlsx: "#00b0a3", xls: "#00b0a3", csv: "#00b0a3", mp3: "#00b0a3", wav: "#00b0a3", m4a: "#00b0a3", mp4: "#16abe0", mov: "#16abe0", url: "#9d833e", jpg: "#9d833e", jpeg: "#9d833e", png: "#9d833e", webp: "#9d833e" };
  var CHIPS = ["mp3", "ppt", "key", "pdf", "docx", "xlsx", "mp4", "網址", "jpg", "png"];
  var SAMPLE_IMG = "sh-01.webp";
  var ICO = {
    up: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5V4M6.5 7.5L10 4l3.5 3.5M4 15.5h12"/></svg>',
    link: '<svg class="ico" viewBox="0 0 16 16"><path d="M6.5 9.5a2.5 2.5 0 003.5 0l2-2a2.5 2.5 0 00-3.5-3.5l-.7.7M9.5 6.5a2.5 2.5 0 00-3.5 0l-2 2a2.5 2.5 0 003.5 3.5l.7-.7"/></svg>',
    x: '<svg class="ico" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    ck: '<svg viewBox="0 0 10 10"><path d="M2 5.3l2 2 4-4.6"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    back: '<svg class="ico" viewBox="0 0 16 16"><path d="M13 8H3M7 4L3 8l4 4"/></svg>',
    spark: '<svg class="ico" viewBox="0 0 12 12" style="width:11px;height:11px"><path d="M6 1.5v3M6 7.5v3M1.5 6h3M7.5 6h3"/></svg>'
  };
  var ST = { step: 1, files: [], note: "", depts: new Set(), people: new Set(), priority: "一般", reason: "", touchedFlag: false, done: null, busy: 0 };

  /* ---------- analysis ---------- */
  function analyse(f) {
    var kindKey = f.kindKey, K = D.KIND[kindKey], today = Cm.today(), it = {
      title: f.name, type: K.type, dept: K.dept, topics: K.topics.slice(), date: today, ext: f.ext,
      excerpt: K.summary, point: K.summary, quote: f.name, size: f.size, _demoSummary: true
    };
    var topicMap = { audio: ["客戶需求"], ppt: ["創意方向"], pdf: ["市場趨勢"], doc: ["客戶需求"], sheet: ["市場趨勢"], image: ["視覺與包裝"], video: ["創意方向"], url: ["市場趨勢", "競品分析"] };
    it.topics = topicMap[kindKey].slice();
    if (/簡報|提案|pitch/i.test(f.name)) { it.topics = ["創意方向"]; it.dept = "業務"; }
    if (/競品|品牌|調查|報告/.test(f.name) && kindKey !== "image") { it.topics = ["競品分析", "市場趨勢"]; it.dept = "策略"; }
    if (/客戶|會議|溝通|進度/.test(f.name)) { it.topics = ["客戶需求"]; it.dept = "業務"; }
    if (/陳列|店頭|包裝|海報|設計/.test(f.name)) { it.topics = ["視覺與包裝"]; it.dept = "創意"; }
    if (kindKey === "audio") { it.dur = f.dur || "18:24"; it.transcript = [["00:42", "發言者 A", "我們先確認這一版的時程，客戶希望兩週內可以看到修改後的內容。"], ["03:15", "發言者 B", "預算的部分也需要重新確認，特別是體驗活動的費用。"]]; it.quote = "客戶希望兩週內看到修改後的版本。"; it.point = K.summary; }
    if (kindKey === "url") { it.url = f.url; it.title = f.title; it.excerpt = "網頁來源：" + Cm.domainOf(f.url) + "。" + K.summary; it.point = K.summary; it.quote = f.title; }
    if (f.thumb) it.img = f.thumb;
    return it;
  }
  function suggestFlag() {
    var d = new Set(), n = ST.note, pri = "一般";
    ST.files.forEach(function (f) {
      var k = f.kindKey; ({ audio: ["業務", "策略"], ppt: ["業務", "創意"], pdf: ["策略"], doc: ["策略", "業務"], sheet: ["策略"], image: ["創意"], video: ["創意", "業務"], url: ["策略", "創意"] }[k] || []).forEach(function (x) { d.add(x); });
    });
    if (/客戶|預算|時程|報價|合約|簽/.test(n)) d.add("業務");
    if (/消費者|市場|資料|趨勢|競品|數字/.test(n)) d.add("策略");
    if (/視覺|設計|海報|包裝|拍攝|色|版型|靈感/.test(n)) d.add("創意");
    if (/重要|緊急|務必|盡快|今天|明天|客戶/.test(n)) pri = "重要";
    var ppl = []; D.PEOPLE.forEach(function (p) { if (d.has(p.dept) && ppl.length < 2 && ppl.filter(function (x) { return x.dept === p.dept; }).length < 1) ppl.push(p); });
    return { depts: D.DEPTS.filter(function (x) { return d.has(x); }), people: ppl.map(function (p) { return p.id; }), priority: pri };
  }
  function applySuggestion(force) {
    if (ST.touchedFlag && !force) return;
    var s = suggestFlag(); ST.depts = new Set(s.depts); ST.people = new Set(s.people); ST.priority = s.priority;
    if (!ST.reason) ST.reason = /客戶/.test(ST.note) ? "內容與客戶的需求有關，需要大家先了解。" : "";
  }

  /* ---------- files ---------- */
  function fileKind(ext) { return Cm.kindOf(ext); }
  function addFileObjects(list) {
    Array.prototype.forEach.call(list, function (file) {
      var ext = Cm.extOf(file.name), k = fileKind(ext);
      var f = { id: "f" + Date.now() + Math.random().toString(36).slice(2, 6), name: file.name, ext: ext || "file", kindKey: k, size: file.size, mime: file.type, stage: 0, result: null };
      ST.files.push(f);
      if (k === "image" && /^image\//.test(file.type || "image/")) {
        var r = new FileReader(); r.onload = function () {
          var img = new Image(); img.onload = function () {
            var cv = document.createElement("canvas"), sc = Math.min(1, 520 / Math.max(img.width, img.height)); cv.width = img.width * sc; cv.height = img.height * sc;
            cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); f.thumb = cv.toDataURL("image/jpeg", .72); render(); }; img.onerror = function () { render(); }; img.src = r.result; }; r.readAsDataURL(file);
      } else if (k === "audio") {
        try { var a = new Audio(); a.preload = "metadata"; a.src = URL.createObjectURL(file); a.onloadedmetadata = function () { if (isFinite(a.duration)) { var m = Math.floor(a.duration / 60), s = Math.round(a.duration % 60); f.dur = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; } URL.revokeObjectURL(a.src); }; } catch (e) {}
      }
      process(f);
    });
    render();
  }
  function addSample(key) {
    var s = D.SAMPLES.filter(function (x) { return x.key === key; })[0];
    var f = { id: "f" + Date.now() + Math.random().toString(36).slice(2, 6), name: s.name, ext: s.ext, kindKey: fileKind(s.ext), size: s.size, stage: 0, sample: true };
    if (key === "url") { f.url = s.name; f.title = Cm.titleFromDomain(s.name); f.name = f.title; }
    if (key === "img") f.thumb = SAMPLE_IMG;
    if (key === "audio") f.dur = "18:24";
    ST.files.push(f); process(f); render();
  }
  function addUrl(u) {
    u = u.trim(); if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try { new URL(u); } catch (e) { Cm.toast("這個網址看起來不太正確，請再確認一次。"); return false; }
    var f = { id: "f" + Date.now(), name: Cm.titleFromDomain(u), title: Cm.titleFromDomain(u), url: u, ext: "url", kindKey: "url", size: 0, stage: 0 };
    ST.files.push(f); process(f); render(); return true;
  }
  var STAGES = ["正在讀取內容", "辨識類型與主題", "自動分類並加入資料庫"];
  function process(f) {
    ST.busy++; f.stage = 0;
    var t = function (ms, fn) { setTimeout(function () { fn(); paint(); }, ms); };
    t(250, function () { f.stage = 1; });
    t(950, function () { f.stage = 2; });
    t(1650, function () { f.stage = 3; });
    t(2250, function () { f.stage = 4; f.result = analyse(f); ST.busy--; applySuggestion(); });
  }
  function paint() { if (ST.step === 1 && !ST.done) { var cards = $("#files"); if (cards) cards.innerHTML = ST.files.map(cardHTML).join(""); var nb = $("#next1"); if (nb) { nb.disabled = !canNext(); } } }
  function canNext() { return ST.files.length > 0 && ST.files.every(function (f) { return f.stage >= 4; }); }

  function thumbHTML(f) {
    if (f.thumb) return '<img alt="" src="' + Cm.thumb(f.thumb) + '">';
    if (f.kindKey === "audio") { var b = ""; for (var i = 0; i < 12; i++) b += '<i style="height:' + (20 + Math.abs(Math.sin(i * 1.3 + f.name.length)) * 80) + '%"></i>'; return '<div class="fw">' + b + '</div>'; }
    if (f.kindKey === "url") return '<div class="fav" style="background:#9d833e;width:38px;height:38px;font-size:17px">' + esc(Cm.domainOf(f.url).charAt(0).toUpperCase()) + '</div>';
    return '<span class="ft" style="color:' + (EXTCOL[f.ext] || "#7c7c86") + '">' + esc(f.ext) + '</span>';
  }
  function cardHTML(f) {
    var proc = STAGES.map(function (s, i) { var c = f.stage > i + 1 || f.stage >= 4 ? "ok" : f.stage === i + 1 ? "run" : ""; return '<div class="st ' + c + '"><span class="pi"></span>' + s + '</div>'; }).join("");
    var r = f.result, body;
    if (f.stage >= 4 && r) {
      body = '<div class="result"><div class="tg"><span class="tag">' + r.type + '</span><span class="tag">' + Cm.deptDot(r.dept) + '&nbsp;' + r.dept + '</span>' + r.topics.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("") + '<span class="tag">' + Cm.fmtDate(r.date) + '</span></div>' +
        '<div class="sm"><em>示範摘要</em>' + esc(r.point) + '</div></div>';
    } else body = '<div class="proc">' + proc + '</div>';
    return '<div class="fcard" data-id="' + f.id + '"><div class="fthumb">' + thumbHTML(f) + '</div><div><div class="fname">' + esc(f.kindKey === "url" ? f.url : f.name) + '</div><div class="fmeta">' + (f.kindKey === "url" ? "網站連結" : (D.KIND[f.kindKey].label + (f.size ? "　" + Cm.fmtSize(f.size) : ""))) + (f.sample ? "　示範檔案" : "") + '</div>' + body + '</div><button class="rm" data-rm="' + f.id + '" aria-label="移除這個檔案">' + ICO.x + '</button></div>';
  }

  /* ---------- panels ---------- */
  function step1() {
    return '<h2>放進任何資料，系統會自動整理。</h2><p class="lead">可以一次拖曳多個檔案，也可以貼上網址。支援錄音、簡報、文件、圖片、試算表與影片等常見格式。</p>' +
      '<div class="drop" id="drop" tabindex="0" role="button" aria-label="選擇檔案或拖曳到這裡"><div class="di">' + ICO.up + '</div><div class="dt">把檔案拖曳到這裡，或按一下選擇檔案</div><div class="ds">可以一次選取多個檔案</div>' +
      '<div class="chips">' + CHIPS.map(function (c) { return '<span class="ftc' + (c === "網址" ? " u" : "") + '">' + c + '</span>'; }).join("") + '</div></div>' +
      '<input type="file" id="fileIn" multiple hidden>' +
      '<div class="row2"><label class="urlf">' + ICO.link + '<input id="urlIn" type="url" placeholder="或貼上一個網站連結，例如 https://example.com/article" autocomplete="off"></label><button class="btn-ghost" id="urlAdd">加入網址</button></div>' +
      '<div class="quickadd"><span>沒有檔案？直接用示範檔案試試：</span>' + D.SAMPLES.map(function (s) { return '<button data-sample="' + s.key + '">' + s.label + (s.key !== "url" ? " ." + s.ext : "") + '</button>'; }).join("") + '</div>' +
      '<div class="files" id="files">' + ST.files.map(cardHTML).join("") + '</div>' +
      '<div class="nav-row"><span class="hint">' + (ST.files.length ? "共 " + ST.files.length + " 個項目" : "請先加入至少一個檔案或網址") + '</span><button class="btn-solid" id="next1"' + (canNext() ? "" : " disabled") + '>下一步：備註說明' + ICO.arrow + '</button></div>';
  }
  function step2() {
    var ex = "這是客戶在週五會議中提到的新需求，希望在下週前確認預算與時程，請策略同事先看第二段。";
    return '<h2>告訴大家，這份資料是什麼。</h2><p class="lead">寫下這份資料的背景、重點，或是你希望大家特別注意的地方。</p>' +
      '<label class="lbl" for="note">備註說明<span class="aitag">' + ICO.spark + 'AI 會讀取</span><small>這段說明會同時給 AI 與同事閱讀，幫助 AI 更準確理解這份資料。</small></label>' +
      '<textarea class="ta" id="note" maxlength="400" placeholder="例如：這是客戶在週五會議中提到的新需求…">' + esc(ST.note) + '</textarea>' +
      '<div class="cnt"><span id="cnt">' + ST.note.length + '</span> / 400</div>' +
      '<div class="ex-note">不知道怎麼寫？<button data-fill="1">放入範例說明</button></div>' +
      '<div class="nav-row"><button class="btn-ghost" data-back="1">' + ICO.back + '上一步</button><button class="btn-solid" data-next="3">下一步：通知對象' + ICO.arrow + '</button></div>';
  }
  function step3() {
    var sug = suggestFlag(), same = sug.depts.join() === D.DEPTS.filter(function (d) { return ST.depts.has(d); }).join();
    var names = D.PEOPLE.filter(function (p) { return ST.people.has(p.id); }).map(function (p) { return p.name; });
    var dl = D.DEPTS.filter(function (d) { return ST.depts.has(d); });
    var notif = "將通知：" + (dl.length ? dl.join("、") + "的同事" : "（尚未選擇對象）") + (names.length ? "，其中包含" + names.join("、") : "") + "，內容是「" + esc(ST.files.length > 1 ? ST.files[0].name + " 等 " + ST.files.length + " 份資料" : (ST.files[0] ? ST.files[0].name : "新資料")) + "」" + (ST.priority === "重要" ? "，並標示為重要" : "") + "。";
    return '<h2>誰應該看到這份資料？</h2><p class="lead">標記相關的部門與同事，他們在資料庫裡就能優先看到，也可以用「與我相關」快速篩選。</p>' +
      '<div class="aisug"><div><b>AI 建議對象：</b>' + (sug.depts.join("、") || "無") + (sug.priority === "重要" ? "，並建議標示為重要" : "") + '。<br>這是依照檔案類型與你寫的備註判斷的，你可以自行調整。</div>' + (same ? '<span class="tag imp" style="white-space:nowrap">已套用建議</span>' : '<button class="apply" data-sug="1" style="white-space:nowrap">套用建議</button>') + '</div>' +
      '<label class="lbl">相關部門<small>可以複選。</small></label><div class="dsel">' + D.DEPTS.map(function (d) { return '<button class="dpill" data-dept="' + d + '" aria-pressed="' + ST.depts.has(d) + '"><i class="dd" style="background:' + D.DEPT_COLOR[d] + '"></i>' + d + '<span class="ck">' + ICO.ck + '</span></button>'; }).join("") + '</div>' +
      '<label class="lbl">指定同事<small>選填，適合需要特別提醒的人。</small></label><div class="ppl">' + D.PEOPLE.map(function (p) { return '<button class="pp" data-ppl="' + p.id + '" aria-pressed="' + ST.people.has(p.id) + '"><span class="av" style="background:' + D.DEPT_COLOR[p.dept] + '">' + p.name.charAt(0) + '</span>' + p.name + '<small>' + p.role + '</small></button>'; }).join("") + '</div>' +
      '<label class="lbl">優先程度<small>選填。</small></label><div class="seg"><button data-pri="一般" aria-pressed="' + (ST.priority === "一般") + '">一般</button><button class="imp" data-pri="重要" aria-pressed="' + (ST.priority === "重要") + '">重要</button></div>' +
      '<label class="lbl" for="reason">為什麼要給他們看？<small>選填，用一句話說明就可以。</small></label><input class="ti" id="reason" maxlength="80" placeholder="例如：客戶調整了預算，需要大家先知道。" value="' + esc(ST.reason) + '">' +
      '<div class="notif"><b>NOTIFICATION PREVIEW</b>' + notif + '</div>' +
      '<div class="nav-row"><button class="btn-ghost" data-back="1">' + ICO.back + '上一步</button><button class="btn-solid" id="commit"' + (ST.depts.size || ST.people.size ? "" : " disabled") + '>加入資料庫</button></div>';
  }
  function stepDone() {
    var d = ST.done;
    return '<div class="done-card"><div class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2>已經加入資料庫了。</h2><p>' + d.length + ' 份資料已完成自動分類，' + (d[0].flag.depts.length ? '並且通知了' + d[0].flag.depts.join("、") + '的同事。' : '') + '現在就可以回到資料庫查看，也可以直接向 ASK 提問。</p>' +
      '<div class="done-list">' + d.map(function (i) { return '<div class="di2"><div class="dth">' + (i.img ? '<img alt="" src="' + Cm.thumb(i.img) + '">' : esc(i.ext)) + '</div><div><div class="dn">' + esc(i.title) + '</div><div class="dm">' + i.type + '　' + i.dept + '　' + i.topics.join("、") + '</div></div></div>'; }).join("") + '</div>' +
      '<div class="done-actions"><a class="btn-solid" href="index.html#new=' + d[0].id + '" id="goHome">回到資料庫，查看剛上傳的資料' + ICO.arrow + '</a><button class="btn-ghost" id="again">再上傳一批</button></div></div>';
  }
  function render() {
    $$("#stepper button").forEach(function (b) { var n = +b.dataset.step; b.classList.toggle("on", !ST.done && n === ST.step); b.classList.toggle("done", ST.done || n < ST.step); });
    var p = $("#panel"), keep = ST.step === 1 && !ST.done && $("#drop") && false;
    p.innerHTML = ST.done ? stepDone() : ST.step === 1 ? step1() : ST.step === 2 ? step2() : step3();
    bind();
  }
  function go(n) {
    if (n > 1 && !canNext()) { Cm.toast(ST.files.length ? "資料還在處理中，請稍等一下。" : "請先加入至少一個檔案或網址。"); return; }
    if (n === 3) applySuggestion();
    ST.step = n; render(); $("#upMain").scrollTo({ top: 0, behavior: "smooth" });
  }
  function bind() {
    var drop = $("#drop");
    if (drop) {
      var fi = $("#fileIn");
      drop.addEventListener("click", function () { fi.click(); });
      drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fi.click(); } });
      fi.addEventListener("change", function () { if (fi.files.length) addFileObjects(fi.files); fi.value = ""; });
      $("#urlAdd").addEventListener("click", function () { var u = $("#urlIn"); if (addUrl(u.value) !== false) u.value = ""; });
      $("#urlIn").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#urlAdd").click(); } });
      $$("[data-sample]").forEach(function (b) { b.addEventListener("click", function () { addSample(b.dataset.sample); }); });
      $$("[data-rm]").forEach(function (b) { b.addEventListener("click", function () { ST.files = ST.files.filter(function (f) { return f.id !== b.dataset.rm; }); render(); }); });
      $("#next1").addEventListener("click", function () { go(2); });
    }
    var n = $("#note"); if (n) n.addEventListener("input", function () { ST.note = n.value; $("#cnt").textContent = n.value.length; });
    $$("[data-fill]").forEach(function (b) { b.addEventListener("click", function () { ST.note = "這是客戶在週五會議中提到的新需求，希望在下週前確認預算與時程，請策略同事先看第二段。"; render(); }); });
    $$("[data-next]").forEach(function (b) { b.addEventListener("click", function () { go(+b.dataset.next); }); });
    $$("[data-back]").forEach(function (b) { b.addEventListener("click", function () { go(ST.step - 1); }); });
    $$("[data-dept]").forEach(function (b) { b.addEventListener("click", function () { ST.touchedFlag = true; var d = b.dataset.dept; ST.depts.has(d) ? ST.depts.delete(d) : ST.depts.add(d); keepRender(); }); });
    $$("[data-ppl]").forEach(function (b) { b.addEventListener("click", function () { ST.touchedFlag = true; var d = b.dataset.ppl; ST.people.has(d) ? ST.people.delete(d) : ST.people.add(d); keepRender(); }); });
    $$("[data-pri]").forEach(function (b) { b.addEventListener("click", function () { ST.touchedFlag = true; ST.priority = b.dataset.pri; keepRender(); }); });
    var rs = $("#reason"); if (rs) rs.addEventListener("input", function () { ST.reason = rs.value; var nt = $(".notif"); });
    if (rs) rs.addEventListener("change", function () { keepRender(); });
    $$("[data-sug]").forEach(function (b) { b.addEventListener("click", function () { ST.touchedFlag = false; applySuggestion(true); keepRender(); }); });
    var c = $("#commit"); if (c) c.addEventListener("click", commit);
    var ag = $("#again"); if (ag) ag.addEventListener("click", function () { ST = { step: 1, files: [], note: "", depts: new Set(), people: new Set(), priority: "一般", reason: "", touchedFlag: false, done: null, busy: 0 }; render(); });
  }
  function keepRender() { var y = $("#upMain").scrollTop; render(); $("#upMain").scrollTop = y; }

  function commit() {
    var now = Date.now(), flag = { depts: D.DEPTS.filter(function (d) { return ST.depts.has(d); }), people: D.PEOPLE.filter(function (p) { return ST.people.has(p.id); }).map(function (p) { return p.name; }), priority: ST.priority, reason: ST.reason.trim() };
    var items = ST.files.map(function (f, i) {
      var r = JSON.parse(JSON.stringify(f.result));
      r.id = "u-" + (now + i); r.created = now + i; r.note = ST.note.trim(); r.flag = flag; r._up = true; delete r._demoSummary;
      if (r.note) r.excerpt = r.excerpt + "（上傳者備註：" + r.note + "）";
      return r;
    });
    Cm.addUploads(items.slice().reverse());
    ST.done = items; render(); $("#upMain").scrollTo({ top: 0, behavior: "smooth" });
  }

  $("#stepper").addEventListener("click", function (e) { var b = e.target.closest("[data-step]"); if (!b || ST.done) return; var n = +b.dataset.step; if (n !== ST.step) go(n); });
  render();
  window.__up = ST;
})();
