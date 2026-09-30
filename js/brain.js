/* ------------------------------------------------------------------
 * askBrain(question, selectedItems) — the single seam for the Ask panel.
 *
 * Demo: resolves canned answers (keyword match) and appends any uploader
 * notes found on cited items. To wire up a real LLM later, replace the body
 * with a fetch() to your backend (send the question + the selected items'
 * text + notes) and return the same shape:
 *   { matched: Boolean, blocks: [{t:"p", s:"text with [[item-id]] citations"} | {t:"ul", items:[...]}], next: [qaId, ...] }
 * ------------------------------------------------------------------ */
(function () {
  "use strict";
  var D = window.PB;
  function plain(s) { return s.replace(/\s?\[\[[\w-]+\]\]/g, ""); }
  function match(text) {
    var t = text.replace(/\s+/g, ""), best = null, score = 0;
    D.QA.forEach(function (qa) {
      var s = 0; if (t === qa.q.replace(/\s+/g, "")) s = 100;
      qa.keys.forEach(function (k) { if (t.toLowerCase().indexOf(k.toLowerCase()) >= 0) s += k.length; });
      if (s > score) { score = s; best = qa; }
    });
    return best;
  }
  function citedIds(blocks) {
    var ids = [], seen = {};
    blocks.forEach(function (b) { (b.t === "p" ? [b.s] : b.items).forEach(function (s) { s.replace(/\[\[([\w-]+)\]\]/g, function (_, id) { if (!seen[id]) { seen[id] = 1; ids.push(id); } }); }); });
    return ids;
  }
  function uploaded() { return D.common.loadUploads(); }
  function latestUpload() { return uploaded()[0]; }

  function uploadAnswer() {
    var u = uploaded(); if (!u.length) return null;
    var it = u[0], blocks = [];
    blocks.push({ t: "p", s: "你最近上傳的是「" + it.title + "」，系統把它自動分類為「" + it.type + "」，歸在「" + it.dept + "」，主題是" + it.topics.join("、") + " [[" + it.id + "]]。" });
    blocks.push({ t: "p", s: "系統辨識出的內容摘要是：" + it.point });
    if (it.note) blocks.push({ t: "p", s: "上傳者在備註中特別說明：「" + it.note + "」，所以我會優先依照這段說明來理解這份資料 [[" + it.id + "]]。" });
    if (it.flag && it.flag.depts && it.flag.depts.length) blocks.push({ t: "p", s: "這份資料已標記給" + it.flag.depts.join("、") + "的同事" + (it.flag.priority === "重要" ? "，並且列為重要資訊" : "") + "，他們在資料庫中會優先看到它。" });
    if (u.length > 1) blocks.push({ t: "p", s: "除了這份，你還上傳了其他 " + (u.length - 1) + " 份資料，都已經加入資料庫，可以直接選取後，用 VIEW 一起查看。" });
    return { matched: true, blocks: blocks, next: ["q1", "q7"] };
  }

  function appendNotes(res, selected) {
    var ids = citedIds(res.blocks), byId = {};
    D.ITEMS.concat(uploaded()).forEach(function (i) { byId[i.id] = i; });
    var withNote = ids.map(function (id) { return byId[id]; }).filter(function (i) { return i && i.note; }).slice(0, 2);
    // keep already-mentioned upload answers untouched
    if (res._noteDone) return res;
    withNote.forEach(function (i) {
      res.blocks.push({ t: "p", s: "另外，「" + i.title + "」的上傳者留下了一段備註：「" + i.note + "」，回答時也一併參考了這段說明 [[" + i.id + "]]。" });
    });
    return res;
  }

  window.askBrain = function (question, selectedItems) {
    return new Promise(function (resolve) {
      var t = question.replace(/\s+/g, "");
      var res = null;
      if (/剛上傳|剛剛上傳|最新上傳|最近上傳|新增的|剛加入|我上傳/.test(t)) res = uploadAnswer();
      if (res) { res._noteDone = true; return resolve(res); }
      var qa = match(question);
      if (!qa) return resolve({ matched: false, blocks: [], next: D.QA.map(function (q) { return q.id; }) });
      var out = { matched: true, qa: qa, blocks: qa.blocks.map(function (b) { return b.t === "p" ? { t: "p", s: b.s } : { t: "ul", items: b.items.slice() }; }), next: qa.next.slice() };
      resolve(appendNotes(out, selectedItems));
    });
  };
  window.askBrain.citedIds = citedIds;
  window.askBrain.plainLen = function (blocks) { var n = 0; blocks.forEach(function (b) { (b.t === "p" ? [b.s] : b.items).forEach(function (s) { n += plain(s).length; }); }); return n; };
})();
