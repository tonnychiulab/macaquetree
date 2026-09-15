## Context

現況架構見 `docs/sdd/architecture.md`，動機見 `proposal.md`。約束：維持純前端、read-only 目錄授權、不新增後端。`SerializedFileNode` 繼續當 Worker ↔ UI 的唯一樹契約。掃描狀態目前全堆在 `App.tsx`，Treemap 與 TreeTable 的「目前根」是分開的。

## Goals / Non-Goals

**Goals:**
- 用最小狀態（`focusedPath` + 掃描結果）打通兩個視覺化
- 把 fallback 組樹與 FSA 掃描都留在 Worker，訊息契約對齊
- 隱私與法律文件先對齊再談功能
- 測試先鎖純函式（bytes、副檔名、組樹、top-N），再動 UI

**Non-Goals:**
- 不換成 squarified treemap 或引入 D3
- 不做 PWA、CSV 匯出、重複檔、i18n
- 不把 inline `styles` 物件全面改造成 CSS Modules（除非碰到本次要改的檔案且改動更小）
- 不重寫整個 `App.tsx` 視覺；只抽出掃描 hook 到能測、能共用焦點為止

## Decisions

### 1. 字型：系統字堆疊，不 self-host
選 `system-ui, "Segoe UI", "Noto Sans TC", sans-serif` 取代 Google Fonts `@import`。
- 替代方案 A：把 woff2 放 `public/fonts` — 多資產、要處理授權子集。
- 替代方案 B：繼續 CDN 但改文案 — 隱私宣稱仍弱。
- 選擇系統字：零新增請求、零授權檔，視覺會差一點，符合本次目標。

### 2. 共用焦點：`focusedPath: string` 放在 App
TreeTable 不再自管 `currentRootPath` 當唯一真相；改由 props `focusedPath` + `onFocusPath`。內部仍可保留 `expandedPaths`。
- 替代：把焦點存進 Treemap — 表格麵包屑會反過來依賴視覺化，耦合更差。
- 替代：context — 只有兩個消費者，props 足夠。

由 `focusedPath` 在樹上解析節點時，沿用現有「相對根 split `/`」邏輯，並在掃描根變更時重設焦點。

### 3. Worker 訊息契約擴充，不另開第二種樹格式
`progress` / `complete` 增加 `skippedCount`。fallback 改為 `postMessage` 傳送 `File[]`（或分批）給同一個 worker 檔，用 `type: 'start-files'` 與現有 `start` 分流。
- 替代：主執行緒 `requestIdleCallback` 組樹 — 仍與 UI 爭用。
- 替代：兩個 worker 檔 — 組樹演算法會分叉，今日 fallback 與 FSA 的 folderCount 規則已不一致，應集中。

深度上限常數 `MAX_SCAN_DEPTH = 64`。目錄去重用 `handle.name + path`；FSA 若能讀 `isSameEntry` 則優先用它。

### 4. 搜尋：扁平符合列，不虛擬化第一輪
搜尋改為走訪收集 `name` 符合的節點，表格渲染該清單（縮排用相對 depth 或顯示相對路徑）。不做 windowing 第一輪，因為扁平結果集通常遠小於整棵展開樹。
- 替代：立刻上 `@tanstack/react-virtual` — 新依賴，對本次搜尋炸彈不是最小解。
- 若收集後仍超過例如 2000 列，UI 顯示截斷提示。常數 `MAX_SEARCH_ROWS = 2000`。

### 5. Charts：一次 DFS，top-10 長度固定為 10 的陣列
抽出 `aggregateFileStats(root): { extStats, largestFiles }` 到 `src/utils/stats.ts`，用插入／替換維護 10 格，副檔名用 Map。ChartsView 只消費純函式結果。
- 替代：在 Worker 掃描時順便聚合 — 會讓 complete 訊息變大、也改變掃描契約；本次不混在一起。

### 6. 型別：最小 `FileSystemDirectoryHandle` 介面，不引入額外 @types 套件
Worker 與 App 共用 `src/types.ts` 裡的 handle / worker message 型別。`webkitdirectory` 用 React 支援的 attribute 寫法，避免 `as any`。
TreeTable 的 root 變更重設：以 `key={rootNode.path}` 讓元件 remount，刪掉 effect 內同步 `setState`。

### 7. 工具鏈
- Vitest + 現有 Vite。
- GitHub Actions：`lint`、`tsc -b`、`vitest`、`npm audit --audit-level=high`。
- `npm audit fix` 升 Vite／PostCSS 等，目標是清掉今日 5 個 high。只動 lockfile 與必要的 semver 範圍。
- `LICENSE` 使用 MIT 標準本文，copyright 持有人用 GitHub 帳號 `tonnychiulab`。

## Risks / Trade-offs

- [Fallback 把大量 `File` postMessage 到 Worker 仍可能卡一下] → 分批傳送（例如每 500 個檔）並保持 progress
- [系統字讓「premium」視覺變素] → 接受；不在本次重做設計系統
- [搜尋改扁平列，層級感變弱] → 列上顯示相對路徑；可在後續里程碑改回「只展開祖先」
- [maxDepth 64 可能截斷極端專案] → 略過計數可見；必要時再做成設定
- [audit fix 可能升 Vite minor] → 以 `npm run build` 當回歸門檻
- [isSameEntry 非到處可用] → path 字串後備，文件化剩餘風險

## Migration Plan

靜態前端，無需資料遷移。部署仍是 `npm run build` 產出 `dist/`。回滾：還原 git commit。使用者瀏覽器沒有持久掃描資料。

## Open Questions

無。GitHub Pages 子路徑暫用相對 `base: './'`，不阻塞規格與任務拆分。
