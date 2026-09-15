# 🐒 MacaqueTree

> **"Monkeys climb trees, MacaqueTree climbs your directory tree!"**
>
> 🐒 獼猴在山林間自由穿梭，而 MacaqueTree 在您的硬碟目錄樹中極速飛躍！

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF.svg)](https://vite.dev/)
[![React](https://img.shields.io/badge/Framework-React_19-61DAFB.svg)](https://react.dev/)

**[線上體驗](https://macaquetree.tw365ai.workers.dev)** — 免安裝，用瀏覽器開啟即可掃描本機資料夾。掃描結果留在目前分頁，不會上傳。

**MacaqueTree (台灣獼猴)** 是獨立的開源、免安裝本機磁碟空間分析工具，與其他商業或開源磁碟分析軟體沒有官方關係。它在您的瀏覽器分頁內讀取目錄中繼資料，應用程式沒有把檔案內容或掃描結果送到自有後端的邏輯。開啟網頁本身仍會向靜態託管下載 HTML/JS。約 5 萬檔以上會顯示記憶體警告。正式建置會加上 Content-Security-Policy；`npm run dev` 不加，以免打斷 Vite HMR。

---

## 🌟 核心理念與台灣特色 (Core Concepts & Rationale)

*   **🐒 獼猴的攀爬喻意**：本專案以**臺灣獼猴（Formosan Macaque，Macaca cyclopis）** 命名。台灣獼猴以敏捷的身手在叢林樹木間穿梭嬉戲；而我們的分析器就如同獼猴一般，在極短時間內遍歷、攀爬您指定的「目錄樹 (Directory Tree)」，找出隱藏在深處的大檔案。
*   **🗽 自由與安全精神**：台灣象徵著民主與高度的自由開放。本專案秉持開源的自由精神，提供使用者一個安全、透明的工具。掃描結果留在目前分頁的記憶體中；本站是靜態前端，仍會下載網頁資產，但不會把目錄樹 POST 到應用程式後端。

---

## ✨ 主要功能 (Key Features)

*   **🚀 多執行緒高速掃描**：使用 **Web Worker** 多執行緒技術，將磁碟深度遞迴遍歷卸載至背景執行，UI 界面維持 60fps 流暢刷新，配備實時「掃描速度」儀表板。
*   **🌳 樹狀目錄鑽取 (Drill down)**：支援折疊、排序、關鍵字搜尋，且雙擊任何資料夾即可像檔案總管一樣深度聚焦該目錄，結合動態麵包屑導航，輕鬆掌握資料夾脈絡。
*   **📊 區塊圖譜（Treemap）**：純前端 SVG 高效渲染區塊圖，區塊大小即硬碟容量大小，色彩按「影片、圖片、壓縮檔、代碼」等副檔名對應，懸停時有浮動 Tooltip 顯示詳情。
*   **📄 掃描報告下載**：掃完可下載 Markdown 報告（摘要、TOP 10 大檔、副檔名、第一層資料夾），檔案在本機產生。
*   **📈 副檔名統計與最大檔案排行**：包含副檔名分佈圓環圖（Doughnut Chart）與 TOP 10 最大檔案直條圖，快速鎖定空間殺手。
*   **🛡️ 100% 隱私沙盒安全**：採用瀏覽器最新 **File System Access API (`showDirectoryPicker`)**。不需下載或安裝任何 exe/dmg，也不需上傳任何位元組到伺服器。
*   **🔌 優雅退路 (Fallback Mode)**：對於尚未支持 showDirectoryPicker API 的瀏覽器（如 Firefox, Safari），系統貼心提供了 `webkitdirectory` 本地檔案流相容分析技術，保證跨平台無礙運作。

---

## 🏗️ 技術棧 (Tech Stack)

*   **前端核心**: React 19 + TypeScript + Vite 8
*   **圖標庫**: Lucide React
*   **設計系統**: 全自定義 Vanilla CSS (Premium Dark Mode, Glassmorphism 磨砂玻璃質感)
*   **多執行緒**: Web Worker (ES Module Worker inside Vite)
*   **視覺化**: 純 React & SVG 原生高效渲染 (無重型可視化包加載，載入速度極快)

---

## 🚀 快速開始 (Quick Start)

想先試用不必克隆：打開 [線上體驗](https://macaquetree.tw365ai.workers.dev)。

### 1. 克隆專案 (Clone the Repository)
```bash
git clone https://github.com/tonnychiulab/macaquetree.git
cd macaquetree
```

### 2. 安裝依賴 (Install Dependencies)
```bash
npm install
```

### 3. 啟動開發伺服器 (Start Dev Server)
```bash
npm run dev
```
啟動後在瀏覽器打開網頁即可立即使用！

### 4. 產品打包 (Production Build)
```bash
npm run build
```
打包完成後，`dist/` 資料夾內的靜態檔案可以部署於任何靜態網頁託管服務平台（如 GitHub Pages, Vercel, Netlify），完全不需要後端伺服器！

---

## 🎨 版本命名規劃 (Milestones & Codenames)

本專案未來的功能迭代與版本將以**台灣著名山岳**命名，象徵台灣獼猴自由攀爬的高山頂峰：

*   **v1.0.0 `Alishan (阿里山)`** — 核心 Web Worker 掃描與 Treemap/樹狀表格基礎架構
*   **v1.1.0 `Bailu (百岳)`** — Markdown 掃描報告、森林主題與瀏覽器圖示 [當前版本]
*   **v1.2.0 `Tawu (大武山)`** — 匯出分析報告 (CSV, JSON) 與掃描歷史紀錄快照對比
*   **v1.3.0 `Syue (雪霸)`** — 重複檔案分析 (Duplicate Files Finder) 與零位元組空資料夾篩選
*   **v2.0.0 `Yushan (玉山)`** — 全能進階跨瀏覽器離線應用 (PWA) 完整支援

---

## 🤝 貢獻指南 (Contributing)

我們非常歡迎各位加入共同維護 **MacaqueTree**！如果您有任何 Bug 修復、新功能建議，歡迎開 **Issue** 或提交 **Pull Request**。
讓這隻自由的台灣獼猴在開源的世界中幫助更多人管理空間！

---

## 📄 開源授權 (License)

本專案採用 [MIT License](LICENSE) 授權。
