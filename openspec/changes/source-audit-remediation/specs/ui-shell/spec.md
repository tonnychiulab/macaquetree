## MODIFIED Requirements

### Requirement: Error banner and dashboard error boundary
掃描或 Worker 載入失敗 SHALL 以可關閉的 `role="alert"` 橫幅顯示。React 渲染錯誤邊界 SHALL 包住整棵 App 樹（含歡迎頁與掃描面板）。錯誤邊界的恢復方式仍可以是整頁重新載入。

#### Scenario: Worker script fails to load
- **WHEN** Worker `onerror` 觸發
- **THEN** 橫幅顯示「掃描引擎載入失敗」與訊息，`isScanning` 變為 false

#### Scenario: User cancels directory picker
- **WHEN** `showDirectoryPicker` 以 `AbortError` 結束
- **THEN** 系統不顯示錯誤橫幅

#### Scenario: Render error on welcome view
- **WHEN** 歡迎頁子樹拋出渲染錯誤
- **THEN** 使用者看到錯誤邊界畫面，而不是整頁白屏且沒有恢復動作

### Requirement: Version and metadata mismatch
畫面上的版本徽章 SHALL 與 `package.json` 的 `version` 一致（顯示為 `Web v` + 該版本）。`index.html` 的 author SHALL 為本倉庫維護者，SHALL NOT 保留脚手架作者字串。README 的 clone URL SHALL 指向 `tonnychiulab/macaquetree`。倉庫 SHALL 含有與 README 徽章相符的 `LICENSE` 檔，以及描述本專案（靜態 SPA、無後端）的 `SECURITY.md`。

#### Scenario: User reads the header badge
- **WHEN** 應用程式渲染 header 且 `package.json` version 為 `1.0.1`
- **THEN** 徽章文字為 `Web v1.0.1`

## ADDED Requirements

### Requirement: Shared focus path across tree and treemap
系統 SHALL 維護單一焦點路徑。樹狀表鑽取、麵包屑、Treemap 雙擊都 SHALL 讀寫同一焦點；重設掃描 SHALL 把焦點清回掃描根。

#### Scenario: Drill in either view
- **WHEN** 使用者在樹狀表或 Treemap 進入同一子資料夾
- **THEN** 兩個分頁都把該資料夾當作目前根，直到使用者再往上或重設
