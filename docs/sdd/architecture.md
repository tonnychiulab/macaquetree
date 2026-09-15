# MacaqueTree 現況架構

> 對應 OpenSpec living specs。本文件描述 2026-09-15 原始碼所見的系統，不是未來 roadmap。

## 1. 系統是什麼

MacaqueTree 是 **純前端 SPA**：使用者在瀏覽器裡授權一個本機資料夾，應用程式遍歷目錄中繼資料，畫出容量樹、Treemap 與副檔名統計。沒有後端、沒有帳號、沒有掃描結果上傳 API。

可比較產品：TreeSize、WinDirStat。那些是原生程式、直接走作業系統檔案 API。MacaqueTree 多了一層瀏覽器沙盒與權限提示，換來免安裝；代價是大目錄記憶體、主執行緒 fallback、以及 File System Access API 的瀏覽器覆蓋率。

## 2. 技術棧

| 層 | 選擇 | 版本（package.json） |
| --- | --- | --- |
| UI | React + TypeScript | 19.2.x / ~6.0.2 |
| 打包 | Vite | ^8.0.12 |
| 圖示 | lucide-react | ^1.16.0 |
| 樣式 | Vanilla CSS + 元件內 `styles` 物件 | `src/index.css` |
| 掃描 | ES Module Web Worker | `src/workers/scan.worker.ts` |
| 視覺化 | 手寫 SVG，無 D3 / ECharts | TreemapView、ChartsView |

進入點：`index.html` → `src/main.tsx` → `src/App.tsx`。

## 3. 邏輯結構

```
App.tsx                         掃描狀態機、FSA / fallback、分頁
├── StatsView                   總容量 / 檔案數 / 耗時
├── TreeTable                   鑽取、搜尋、排序
├── TreemapView                 slice-and-dice SVG
├── ChartsView                  環形圖 + TOP 10 + 副檔名表
├── ErrorBoundary               僅包住 dashboard
└── scan.worker.ts              遞迴 FileSystemDirectoryHandle
SerializedFileNode (types.ts)   跨執行緒的唯一資料契約
helpers.ts                      formatBytes、副檔名色與分類
```

`src/App.css` 是 Vite 範本殘件，未被 import。`public/favicon.svg` 是 Vite logo。

## 4. 掃描資料流

```
[使用者選資料夾]
        │
        ├─ showDirectoryPicker 存在
        │     → postMessage({directoryHandle}) 到 Worker
        │     → scanHandle 遞迴 values() / getFile()
        │     → progress (≤100ms) → complete({rootNode})
        │
        └─ 否則 webkitdirectory FileList
              → 主執行緒 processFile 組 Map 樹
              → 約每 16ms yield
              → setRootNode
```

`SerializedFileNode` 欄位：`name`, `path`, `kind`, `size`, `fileCount`, `folderCount`, `depth`, 可選 `extension` / `lastModified` / `children`。路徑以 `/` 拼接，不使用作業系統原生分隔符。

## 5. 信任邊界

| 邊界 | 誰 | 現況 |
| --- | --- | --- |
| 本機目錄 | 使用者授權 | FSA `mode: 'read'` 或 `<input type=file>` |
| Worker 訊息 | 同源腳本 | 無驗證；訊息來源即本頁 |
| DOM 渲染 | 檔名 / 錯誤字串 | React 文字節點，無 `dangerouslySetInnerHTML` |
| 網路 | 頁面載入 | Google Fonts CDN；應用程式邏輯無上傳 |
| 開發伺服器 | `vite` | npm audit 顯示 Windows 相關高風險項，只影響 `npm run dev`，不進入 `dist/` 靜態託管 |

沒有認證、授權模型或多租戶。管理員與一般使用者是同一人。

## 6. 已知架構壓力

1. `App.tsx` 約 870 行，掃描與 UI 殼層耦合。
2. 整棵樹進出 Worker 靠 structured clone，大目錄會雙份佔記憶體。
3. Fallback 掃描在主執行緒，與「多執行緒」文案不一致。
4. TreeTable / ChartsView 沒有虛擬化或 bounded 聚合，搜尋會走完整子樹。
5. Treemap 與 TreeTable 的「目前根」沒有共用狀態。
6. 沒有測試、沒有 CI；`npm run lint` 在今日檢測為 12 errors。
