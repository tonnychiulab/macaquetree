## Purpose

定義應用程式殼層狀態機：歡迎頁、掃描中儀表、錯誤橫幅、結果分頁切換，以及版本與 metadata 如何呈現給使用者。

## Requirements

### Requirement: Three app states
系統 SHALL 在無結果、掃描中、有結果三種狀態間切換，互斥顯示歡迎區、掃描面板、或儀表板。

#### Scenario: Fresh visit
- **WHEN** 頁面載入且尚未掃描
- **THEN** 顯示歡迎文案、API 支援說明，以及選擇資料夾按鈕

#### Scenario: Scan completes
- **WHEN** Worker 或 fallback 回傳根節點
- **THEN** 顯示 StatsView 與三個分頁：樹狀目錄、Treemap、Charts

### Requirement: Dashboard tabs
有結果時系統 SHALL 提供 `tree` / `treemap` / `charts` 三個 tab。`selectedNode` 在樹狀表與 Treemap 之間共用，Charts 不使用選取狀態。

#### Scenario: Switch tabs
- **WHEN** 使用者點選另一個 tab
- **THEN** 只更換內容區元件，不丟棄掃描樹

### Requirement: Error banner and dashboard error boundary
掃描或 Worker 載入失敗 SHALL 以可關閉的 `role="alert"` 橫幅顯示。儀表板外包了一層 ErrorBoundary；歡迎頁與掃描面板目前不在該邊界內。ErrorBoundary 恢復方式為整頁 `location.reload()`。

#### Scenario: Worker script fails to load
- **WHEN** Worker `onerror` 觸發
- **THEN** 橫幅顯示「掃描引擎載入失敗」與訊息，`isScanning` 變為 false

#### Scenario: User cancels directory picker
- **WHEN** `showDirectoryPicker` 以 `AbortError` 結束
- **THEN** 系統不顯示錯誤橫幅

### Requirement: Version and metadata
UI 標題徽章 SHALL 顯示 `package.json` 的 version（目前 `1.1.0`），不含 `Web v` 前綴。`index.html` 的 author SHALL 為維護者帳號。倉庫 SHALL 含 `LICENSE`（MIT）。

#### Scenario: User reads the header badge
- **WHEN** 應用程式渲染 header
- **THEN** 徽章文字等於建置時寫入的 `__APP_VERSION__`

### Requirement: Single scan action on welcome
歡迎狀態 SHALL 只顯示一顆選擇資料夾按鈕（英雄區），header 不再重複同一 CTA。

#### Scenario: Fresh visit scan button
- **WHEN** 頁面載入且尚未掃描
- **THEN** 名稱為掃描動作標籤的 button 只有一個

### Requirement: Large scan warning
檔案數達到 `LARGE_SCAN_WARN_FILES`（50_000）時，掃描中與結果儀表板 SHALL 顯示 `role="status"` 記憶體警告。

#### Scenario: Complete message reports a huge tree
- **WHEN** Worker 完成且 `totalFiles` ≥ 50_000
- **THEN** 畫面顯示建議改掃較小子資料夾的警告
