/* Shared helpers for Pitcherest pages (home + upload). Demo only. */
(function () {
  "use strict";
  var D = window.PB;
  var C = PB.common = {};
  C.$ = function (s, r) { return (r || document).querySelector(s); };
  C.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  C.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  C.hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  C.rng = function (seed) { var a = seed; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  C.bars = function (id, n) {
    var r = C.rng(C.hash(id)), out = "";
    for (var i = 0; i < n; i++) { var env = .35 + .65 * Math.abs(Math.sin(i / n * 5 + r() * 1.3)); out += '<i style="height:' + Math.max(14, Math.round(env * (.4 + r() * .6) * 100)) + '%"></i>'; }
    return out;
  };
  C.fmtDate = function (d) { var p = d.split("-"); return (+p[1]) + " 月 " + (+p[2]) + " 日"; };
  C.fmtLong = function (d) { var p = d.split("-"); return p[0] + " 年 " + (+p[1]) + " 月 " + (+p[2]) + " 日"; };
  C.shortDate = function (d) { var p = d.split("-"); return p[1] + "/" + p[2]; };
  C.today = function () { var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; }; return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  C.fmtSize = function (n) { if (!n) return ""; if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + " KB"; return (n / 1024 / 1024).toFixed(1) + " MB"; };
  C.thumb = function (img) { return /^(data:|blob:|https?:)/.test(img) ? img : "assets/img/t/" + img; };
  C.full = function (img) { return /^(data:|blob:|https?:)/.test(img) ? img : "assets/img/" + img; };
  C.deptDot = function (d) { return '<i class="dd" style="background:' + D.DEPT_COLOR[d] + '" title="' + d + '"></i>'; };

  C.toast = function (msg) {
    var t = C.$("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show");
    clearTimeout(C.toast._t); C.toast._t = setTimeout(function () { t.classList.remove("show"); }, 2800);
  };

  /* ---------- persistence ---------- */
  var KEY = "pitcherest.uploads.v2";
  C.loadUploads = function () { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
  C.saveUploads = function (list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { // quota: drop thumbnails of oldest items and retry
      try { list.forEach(function (i) { if (/^data:/.test(i.img || "")) delete i.img; }); localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e2) { return false; }
    }
  };
  C.addUploads = function (items) { var l = C.loadUploads(); items.forEach(function (i) { l.unshift(i); }); return C.saveUploads(l); };
  C.clearUploads = function () { try { localStorage.removeItem(KEY); } catch (e) {} };

  /* ---------- file kind ---------- */
  C.extOf = function (name) { var m = /\.([A-Za-z0-9]+)$/.exec(name || ""); return m ? m[1].toLowerCase() : ""; };
  C.kindOf = function (ext) {
    for (var k in D.KIND) if (D.KIND[k].exts.indexOf(ext) >= 0) return k;
    return "doc";
  };
  C.domainOf = function (u) { try { return new URL(/^https?:/.test(u) ? u : "https://" + u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
  C.titleFromDomain = function (u) {
    var d = C.domainOf(u).split(".")[0].replace(/[-_]+/g, " ");
    return d.replace(/\b\w/g, function (c) { return c.toUpperCase(); }) + " 網站文章";
  };

  /* ---------- top bar (project switcher) ---------- */
  C.initProject = function () {
    var btn = C.$("#projectBtn"), pop = C.$("#projectPop"); if (!btn) return;
    C.$("#projectName").textContent = D.PROJECTS[0].name;
    pop.innerHTML = D.PROJECTS.map(function (p, i) {
      return '<button data-i="' + i + '" class="' + (i === 0 ? "cur" : "") + '"><div class="pn">' + p.name + '</div><div class="pm">' + p.meta + '</div></button>';
    }).join("") + '<div class="pnote">這是示範版本，目前只提供第一個比稿專案的內容。</div>';
    btn.addEventListener("click", function (e) { e.stopPropagation(); var open = pop.hidden; pop.hidden = !open; btn.setAttribute("aria-expanded", open); });
    pop.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; pop.hidden = true; btn.setAttribute("aria-expanded", false);
      if (b.dataset.i !== "0") C.toast("示範版本目前只提供「某飲料品牌新品上市」的內容。");
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".switcher")) { pop.hidden = true; btn.setAttribute("aria-expanded", false); } });
  };
  C.initProject();
})();
