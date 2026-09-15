# MacaqueTree 原始碼檢測報告

- **日期**：2026-09-15
- **對象**：https://github.com/tonnychiulab/macaquetree `main` @ `708750b`
- **範圍**：倉庫內全部應用程式碼（約 15 個 TS/TSX 檔）+ 設定檔 + README/SECURITY；不含實作修正
- **方法**：通讀原始碼、對照 README 宣稱、`npm run lint`、`npm run build`、`npm audit`
- **對應修正計畫**：`openspec/changes/source-audit-remediation/`

本專案是瀏覽器本機磁碟分析 SPA，**沒有伺服器攻擊面**。安全結論以「可利用的真實損害」為準，不以 OWASP 清單灌水。多數問題是產品宣稱與實作落差、正確性、效能與工程衛生。

## 1. 驗證結果

| 檢查 | 結果 |
| --- | --- |
| `npm run build` | 通過（Vite 8.0.14，約 239 kB JS gzip 74.5 kB） |
| `npm run lint` | **失敗**：12 errors（`no-explicit-any` ×11，`react-hooks/set-state-in-effect` ×1） |
| `npm audit` | 7 vulnerabilities（1 low / 1 moderate / 5 high），均在 **dev/bundler 工具鏈** |
| LICENSE 檔 | **不存在**（README 卻掛 MIT badge） |
| 自動化測試 | **不存在** |
| CI | **不存在** |

## 2. 做得好的地方

- 掃描主路徑把遞迴丟進 Web Worker，進度節流 100ms，取消用 `terminate()`。
- FSA 使用 `mode: 'read'`，不讀檔案內容、只取 `File` 中繼資料。
- React 以文字節點渲染檔名與錯誤，沒有 `dangerouslySetInnerHTML`、沒有 `eval`。
- 已有 ErrorBoundary、部分 ARIA（tab、treegrid、搜尋 label）。
- `formatBytes` 有 finite / 負數 / 單位上限處理。
- v1.0.1 已修過一輪 a11y 與效能（`d2d3f4f`）。

## 3. 發現清單

嚴重度：P0 對外正確性/法律/隱私宣稱，P1 使用者可感知缺陷或明顯效能陷阱，P2 工程衛生與可維護性。

### P0

| ID | 問題 | 證據 | 建議 |
| --- | --- | --- | --- |
| P0-1 | 宣稱 MIT 但倉庫沒有 `LICENSE` | README L91；根目錄無 LICENSE。無授權檔時預設是 All Rights Reserved | 加入 MIT `LICENSE`，clone URL 改為 `tonnychiulab/macaquetree` |
| P0-2 | `SECURITY.md` 仍是 GitHub 範本 | 內容列 5.1.x / 4.0.x，與本專案 1.0.1 無關 | 改成靜態站、無後端、如何在 GitHub Issues 回報 |
| P0-3 | 「純本機」與 Google Fonts CDN 不一致 | `src/index.css` L1 `@import` fonts.googleapis.com | 改系統字型或 self-host；文案改成與實際網路行為一致 |
| P0-4 | Treemap 文案承諾雙擊鑽取，程式沒做 | `TreemapView.tsx` L133 vs 無 `onDoubleClick` | 實作鑽取，或刪除誤導文案（計畫採實作） |

### P1

| ID | 問題 | 證據 | 建議 |
| --- | --- | --- | --- |
| P1-1 | Fallback 掃描在主執行緒 | `App.tsx` `handleFallbackScan`；Firefox/Safari 會卡 UI | 把組樹搬進 Worker 或 async chunk worker |
| P1-2 | 進度條永遠 100% 寬 | `App.tsx` L424 `width: '100%'` | 改為不確定進度樣式，或用已處理檔案/總檔案（fallback 可知總數） |
| P1-3 | 讀取失敗被靜默略過 | `scan.worker.ts` L106-119 | 累計 skipped，完成時在 UI 顯示 |
| P1-4 | Tree 鑽取與 Treemap 不同步 | Treemap 永遠用掃描 `rootNode` | 抽出 `focusedNode` / `focusedPath` 共用 |
| P1-5 | 搜尋遍歷整棵子樹且無虛擬化 | `TreeTable.tsx` L149 `deferredSearchQuery` 即展開全部 | 搜尋改為收集相符節點；列虛擬化 |
| P1-6 | Charts 先把所有檔案推進陣列再 sort | `ChartsView.tsx` L24-56 | TOP 10 用 bounded 選擇；統計只走一次累加 |
| P1-7 | 無深度上限 / 循環防護 | `scanHandle` 無 maxDepth | 加 maxDepth 與已拜訪 handle 集合（防 junction） |
| P1-8 | 版本與作者資訊錯亂 | badge `Web v1.0`；`package.json` 1.0.1；author「Antigravity Team」 | 單一版本來源；author 改實際維護者 |

### P2

| ID | 問題 | 證據 | 建議 |
| --- | --- | --- | --- |
| P2-1 | `App.tsx` 過重 | ~870 行，掃描+layout+inline styles | 抽出 `useDirectoryScan` 與殼層元件 |
| P2-2 | 大量 `any` | lint 11 處，含 Worker handle | 補 File System Access 型別或最小 interface |
| P2-3 | TreeTable effect 內同步 setState | lint `react-hooks/set-state-in-effect` | 改 key reset 或掃描 id 派生初始 state |
| P2-4 | 死碼 `App.css`、Vite favicon | 未被 import；`public/favicon.svg` 為 Vite 標誌 | 刪除或換成專案識別 |
| P2-5 | 無測試、無 CI | package.json 無 test script | Vitest 先測 `helpers.ts` 與純函式組樹 |
| P2-6 | 無 `vite.base` | 不利 GitHub Pages 子路徑 | 文件化部署路徑或加 `base` |
| P2-7 | ErrorBoundary 只包 dashboard | `App.tsx` L509 | 上提到 `main.tsx` 包住 App |
| P2-8 | 副檔名色盤與分類表不一致 | `getExtensionColor` 缺 `.webm` 等，`getExtensionCategory` 有 | 單一來源對照表 |

## 4. 安全評估（有影響才列）

信任模型：使用者分析自己的磁碟；攻擊者若要害人，必須先讓被害人開啟這個靜態頁並授權目錄。沒有 SSR、沒有使用者內容持久化到伺服器。

**不構成產品漏洞（或僅 hardening）：**

- 無 CSP：靜態 SPA 且輸出已轉義，缺少 CSP 不是獨立可利用點。
- 無 rate limit：無網路 API。
- Worker 不驗證 message origin：同源頁面自己 postMessage，不是跨來源訊息。

**需要處理的安全/隱私項：**

1. **隱私宣稱 vs Fonts CDN（P0-3）**：冷啟動會連 Google。不是檔案外洩，但直接打臉「不上傳、純本機」。
2. **Vite 開發伺服器 advisory（dev-only）**：`GHSA-fx2h-pf6j-xcff`（Windows `server.fs.deny` bypass）、`GHSA-v6wh-96g9-6wx3`（UNC / NTLMv2）。影響 `npm run dev`，**不進入 production `dist/`**。修正：`npm audit fix` 升 Vite。
3. **其餘 audit（postcss / nanoid / browserslist / brace-expansion / babel）**：建置鏈 DoS 或 source map 讀檔，對「使用者開靜態網站分析自己硬碟」這條產品路徑衝擊低。仍應 `npm audit fix` 保持供應鏈乾淨。
4. **檔名 XSS**：目前 React 文字節點足夠；之後若改 `innerHTML` 或 SVG `innerHTML` 必須回歸測試。

本次是單次人工通讀。此專案很小，覆蓋率高於典型大系統；仍建議修正完成後再跑一次 lint/audit。

## 5. 優先順序（給修正計畫）

1. 文件與法律：LICENSE、SECURITY.md、README clone URL、版本/作者
2. 宣稱與行為：Fonts、Treemap 鑽取、略過檔案、進度條
3. 效能：fallback Worker、搜尋/表格虛擬化、Charts bounded top-N
4. 工程：去掉 `any`、拆 `App.tsx`、Vitest + CI、audit fix

詳細任務見 `openspec/changes/source-audit-remediation/tasks.md`。

## 6. 同日修正狀態

`source-audit-remediation` 已實作。下列為對照本報告的關閉結果（不是重寫原始發現）：

| ID | 狀態 |
| --- | --- |
| P0-1 LICENSE / clone URL | 已關閉：根目錄 MIT `LICENSE`（copyright `tonnychiulab`），README clone 指向 `tonnychiulab/macaquetree` |
| P0-2 SECURITY.md 範本 | 已關閉：改為靜態 SPA、無後端、Issues 回報 |
| P0-3 Google Fonts CDN | 已關閉：系統字堆疊；`dist` CSS 無 `fonts.googleapis.com` |
| P0-4 Treemap 鑽取文案 | 已關閉：雙擊資料夾鑽取，與 `focusedPath` 共用 |
| P1-1 Fallback 主執行緒組樹 | 已關閉：Worker `start-files` 分批組樹 |
| P1-2 進度條永遠 100% | 已關閉：FSA 不確定動畫；fallback 顯示 i／N |
| P1-3 讀取失敗靜默略過 | 已關閉：`skippedCount` 進 UI |
| P1-4 Tree / Treemap 不同步 | 已關閉：App 持有 `focusedPath` |
| P1-5 搜尋展開整棵子樹 | 已關閉搜尋扁平收集與 `MAX_SEARCH_ROWS` 截斷；列虛擬化仍未做 |
| P1-6 Charts 全量 filesList | 已關閉：`aggregateFileStats` 單次 DFS |
| P1-7 無深度／循環防護 | 已關閉：`MAX_SCAN_DEPTH=64` 與 `isSameEntry`／path |
| P1-8 版本與作者 | 已關閉：`Web v` + `package.json`；author `tonnychiulab` |

未納入此次變更、仍只列在 README 里程碑：CSV 匯出、重複檔案分析、PWA。

驗證（2026-09-15）：`npm run lint` 0 error、`tsc -b` 通過、`npm test` 49 passed、statements **94.71%** / lines **97%**（不含 `src/main.tsx` 與 worker 膠合）、`npm run build` 通過、`npm audit --audit-level=high` 0。
