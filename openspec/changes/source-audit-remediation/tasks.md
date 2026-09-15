## 1. 法律文件與工具鏈底座

- [x] 1.1 新增 MIT `LICENSE`（copyright `tonnychiulab`），改寫 `SECURITY.md` 為本專案政策（靜態 SPA、無後端、Issues 回報），並把 README clone URL 改成 `https://github.com/tonnychiulab/macaquetree.git`；用目錄確認三個檔都存在且不再出現 `yourusername` 或 5.1.x 範本版本表
- [x] 1.2 加入 Vitest（沿用 Vite），在 `package.json` 增加 `test` script，新增 `src/utils/helpers.test.ts` 覆蓋 `formatBytes` 的 0／負數／非有限數字／TB 級；執行 `npm test` 須通過
- [x] 1.3 執行 `npm audit fix`，再跑 `npm run build` 與 `npm audit --audit-level=high`；high 應為 0，build 須成功

## 2. 型別與聚合純函式

- [x] 2.1 在 `src/types.ts` 補上 Worker 訊息、`FileSystemDirectoryHandle` 最小介面，以及 `MAX_SCAN_DEPTH = 64`、`MAX_SEARCH_ROWS = 2000`；`tsc -b` 須通過且不再為了 handle 使用 `any`
- [x] 2.2 新增 `src/utils/stats.ts` 的 `aggregateFileStats`（單次 DFS、Map 加總副檔名、長度 ≤10 的 largestFiles），並寫測試：多檔排序前 10 名與「全收集再 sort」一致、無檔案回空；`npm test` 通過
- [x] 2.3 把 `getExtensionColor`／`getExtensionCategory` 收成同一來源表，測試 `.webm` 與 `.mp4` 同屬 Video 且有對應色；`npm test` 通過

## 3. 隱私與殼層事實

- [x] 3.1 刪除 `src/index.css` 的 Google Fonts `@import`，改系統字堆疊；在建置後的 `dist` CSS 搜尋不到 `fonts.googleapis.com`
- [x] 3.2 更新歡迎頁安全提示與 README 隱私段落，使其符合「本機處理中繼資料、無上傳邏輯、靜態託管仍會下載 HTML/JS」；全文搜尋不得再出現絕對的「絕不上傳任何檔案」同時又暗示完全離線
- [x] 3.3 header 徽章改為 `Web v` + `package.json` version，`index.html` author 改為維護者；畫面上不再出現 `Web v1.0` 或 `Antigravity Team`
- [x] 3.4 將 `ErrorBoundary` 上移到 `main.tsx` 包住 `App`；確認歡迎頁路徑也在邊界內（讀 `main.tsx` 即可驗證）
- [x] 3.5 刪除未使用的 `src/App.css`；`grep` 專案內無 `App.css` 引用且檔案不存在

## 4. 掃描引擎

- [x] 4.1 Worker 的 `progress`／`complete` 增加 `skippedCount`；讀取失敗累加略過；UI 在略過 > 0 時顯示件數。用模擬 Worker 訊息或單元測試驗證 complete payload 含該欄位
- [x] 4.2 實作 `MAX_SCAN_DEPTH` 與已拜訪目錄防護（優先 `isSameEntry`，否則 path）；超過深度計入 skipped。以純函式或 worker 測試夾具驗證深度 65 被截斷
- [x] 4.3 同一 Worker 增加 `start-files`：分批接收 `File[]` 組樹，主執行緒 fallback 不再在 `handleFallbackScan` 裡組完整樹。讀 `App.tsx` 確認組樹迴圈已不在主檔，且停止按鈕仍呼叫 `worker.terminate()`
- [x] 4.4 FSA 掃描中進度列改為不確定樣式（CSS 不定動畫，寬度不是 100% 實心完成條）；fallback 顯示 i／N。對 `App.tsx`／CSS 目視確認不再寫死 `width: '100%'` 當完成百分比

## 5. 共用焦點與 Treemap 鑽取

- [x] 5.1 App 持有 `focusedPath`，掃描完成或 reset 時設為根路徑；TreeTable 以 props 接收並用 `key={rootNode.path}` remount，刪除 effect 內同步 setState。`npm run lint` 不再對 TreeTable 報 `set-state-in-effect`
- [x] 5.2 Treemap 以焦點節點為佈局根，雙擊資料夾呼叫 `onFocusPath`，雙擊檔案不改焦點；切換分頁後 Treemap 與麵包屑同一目錄。以元件測試或手動清單：表格鑽取 → 切 Treemap → 區塊對應該子樹
- [x] 5.3 更新 Treemap 說明文字，使其與雙擊鑽取行為一致，不再承諾未實作功能

## 6. 搜尋與 Charts

- [x] 6.1 TreeTable 搜尋改為收集符合節點的扁平列，顯示相對路徑，超過 `MAX_SEARCH_ROWS` 截斷並提示；驗證搜尋時不會因 `deferredSearchQuery` 而 traverse 出「每個子孫都是 visible row」
- [x] 6.2 `ChartsView` 改呼叫 `aggregateFileStats`，刪除元件內的全量 `filesList`；grep 該檔確認沒有 `filesList` 或同等全檔陣列

## 7. Lint、CI、收尾

- [x] 7.1 清掉 `App.tsx` 與 `scan.worker.ts` 剩餘 `any`（含 `webkitdirectory` 寫法）；`npm run lint` 0 error
- [x] 7.2 新增 `.github/workflows/ci.yml`：install、lint、`tsc -b`、test、`npm audit --audit-level=high`；workflow 檔存在且步驟涵蓋這四項
- [x] 7.3 替換或註明 `public/favicon.svg` 不再使用 Vite logo；`vite.config.ts` 設 `base: './'` 且 `npm run build` 成功
- [x] 7.4 對照 `docs/audit/2026-09-15-source-inspection.md` 的 P0／P1 逐項勾選，未做的只能留在 README 里程碑（CSV／PWA／重複檔）；檢測報告 P0 必須全部關閉
