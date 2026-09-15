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

### Requirement: Version and metadata mismatch
UI 標題徽章目前 SHALL 顯示 `Web v1.0`（不讀取 `package.json` 的 `1.0.1`）。`index.html` 的 author SHALL 為 `Antigravity Team`。README 宣稱 MIT，倉庫沒有 `LICENSE` 檔。`SECURITY.md` 仍是 GitHub 範本（列了 5.x/4.x 版本）。這些是文件／呈現現況，將由修正變更對齊。

#### Scenario: User reads the header badge
- **WHEN** 應用程式渲染 header
- **THEN** 徽章文字為 `Web v1.0`，不讀取 `package.json` 的 version 欄位
