# Pitcherest

「一場比稿，一個共同大腦」— 互動式網站原型（概念示範）。

純靜態網站（HTML / CSS / JavaScript），沒有後端。所有專案、人名、品牌與資料皆為虛構的示範資料；提問的回答為預先寫好的示範內容。

- `index.html`、`css/`、`js/`：網站本體
- `assets/img/`：以 Python（Pillow）產生的示意圖片，見 `tools/make_images.py`、`tools/make_images2.py`
- `upload.html`、`js/upload.js`：上傳頁（三個步驟），資料以 localStorage 保存
- `js/brain.js`：`askBrain(question, selectedItems)`，之後可改接 GPT
- `tools/qa.py`：用 Playwright 走完整個流程並擷取畫面（`screenshots/v2/`）
