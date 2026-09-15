## Why

2026-09-15 對 `main` 的原始碼通讀發現：產品 README／UI 宣稱與實作有落差（授權檔缺失、隱私文案 vs Google Fonts、Treemap 雙擊鑽取未做），加上 fallback 掃描卡主執行緒、靜默略過檔案、無測試／CI。現在用 OpenSpec 把「要修什麼」鎖成可 archive 的行為規格，避免之後實作時範圍漂掉。

## What Changes

- 補齊 MIT `LICENSE`、可執行的 `SECURITY.md`、正確 clone URL 與版本／作者資訊
- 首次載入改為不依賴第三方字型 CDN，讓「本機處理、不上傳」與實際網路行為一致
- Treemap 補上雙擊鑽取，並與樹狀表共用目前焦點路徑
- 掃描改為可觀察：誠實的不確定／真實進度、略過檔案計數、Fallback 不再阻塞 UI
- 樹狀搜尋與 Charts TOP 10 改為可在大目錄下使用的演算法（不再展開整棵樹、不再收集全部檔案陣列）
- 掃描加深度上限與已拜訪節點防護
- 補 helpers／組樹的單元測試與 CI（lint、typecheck、test、audit）
- 清理死碼與 Vite 範本殘件；收斂 `any` 與 TreeTable 的 effect setState
- **不**在本次加入 CSV 匯出、重複檔偵測、PWA（仍屬 README 的後續里程碑）

## Capabilities

### New Capabilities
- （無。本次是收斂現有產品，不新增領域能力。）

### Modified Capabilities
- `privacy-sandbox`: 首次載入不得請求第三方字型；隱私文案必須符合實際網路與授權狀態
- `directory-scan`: 略過項目要回報；進度不可偽裝成百分比；Fallback 必須離開主執行緒；加入深度／循環防護
- `tree-table`: 搜尋不得把整棵子樹展開渲染；與 Treemap 共用焦點路徑
- `treemap`: 雙擊資料夾必須鑽取；佈局跟隨時焦路徑而非永遠用掃描根
- `charts`: TOP 10 與副檔名統計不得為了排行而物化全部檔案節點
- `ui-shell`: 版本徽章、頁面 metadata、錯誤邊界範圍與倉庫事實一致

## Impact

- 程式：`src/App.tsx`、`src/workers/scan.worker.ts`、`src/components/TreeTable.tsx`、`src/components/TreemapView.tsx`、`src/components/ChartsView.tsx`、`src/utils/helpers.ts`、`src/index.css`、`src/main.tsx`、`index.html`
- 文件：`README.md`、`SECURITY.md`、新增 `LICENSE`
- 工具鏈：`package.json` scripts、Vite 版本（`npm audit fix`）、新增 Vitest、GitHub Actions
- API：無後端；不改變 File System Access 權限模型（維持 read-only）
- 相容：Fallback 瀏覽器行為應對使用者保持可用，只改執行緒與回報方式
