## Purpose

定義目錄掃描如何把本機資料夾轉成可序列化的 `SerializedFileNode` 樹，以及掃描進度、取消與錯誤如何回報給 UI。

## Requirements

### Requirement: Web Worker scan on File System Access API
當瀏覽器支援 `showDirectoryPicker` 時，系統 SHALL 在 ES Module Web Worker 中遞迴遍歷 `FileSystemDirectoryHandle`，主執行緒 SHALL 只接收 `progress` / `complete` / `error` 訊息。

#### Scenario: Successful scan
- **WHEN** Worker 收到 `{ type: 'start', directoryHandle }` 且目錄可讀
- **THEN** 系統回傳根節點，每個目錄的 `children` 依 `size` 降序排序，並附上 `totalFiles`、`totalFolders`、`totalSize`、`executionTime`

#### Scenario: Progress throttling
- **WHEN** 掃描進行中
- **THEN** Worker 最多每 100ms 發送一次 `progress` 訊息，包含目前路徑與累計檔案/資料夾/容量

#### Scenario: Cancel scan
- **WHEN** 使用者按下停止掃描
- **THEN** 主執行緒 `terminate()` 該 Worker，UI 離開掃描中狀態

### Requirement: Main-thread fallback scan
當瀏覽器不支援 File System Access API 時，系統 SHALL 在主執行緒以 `FileList` 組樹，並以約 16ms 間隔 `setTimeout(0)` 讓出事件迴圈。Fallback 路徑目前不使用 Web Worker。

#### Scenario: Fallback processes files
- **WHEN** 使用者選取含 `webkitRelativePath` 的檔案清單
- **THEN** 系統依路徑建立資料夾節點、把檔案掛到對應父節點，並沿祖先路徑累加 `size` 與 `fileCount`

#### Scenario: Fallback omits empty folders
- **WHEN** 被選資料夾含有不含任何檔案的空目錄
- **THEN** Fallback 掃描不會建立該空目錄節點，因為 `webkitdirectory` 只提供檔案

### Requirement: Silent skip of unreadable entries
Worker 掃描遇到單一檔案或子目錄讀取失敗時，系統 SHALL 略過該項目並 `console.warn`，目前 SHALL NOT 把略過清單顯示在 UI。

#### Scenario: Locked or permission-denied file
- **WHEN** `entry.getFile()` 或子目錄遍歷拋錯
- **THEN** 該項目不進入結果樹，掃描繼續，使用者看不到略過計數

### Requirement: Indeterminate progress bar
掃描中的進度條目前固定為滿寬動畫，SHALL NOT 被解讀成完成百分比。

#### Scenario: Scanning UI
- **WHEN** `isScanning` 為 true
- **THEN** UI 顯示已掃描檔案數、資料夾數、累積容量、估算速度（每 500ms 取 delta×2）以及目前路徑；進度條為不確定動畫而非真實百分比

### Requirement: In-memory tree only
完整目錄樹 SHALL 以結構化複製從 Worker 傳到主執行緒並留在 React state。系統目前不對樹做分頁、索引或磁碟快取。

#### Scenario: Large directory
- **WHEN** 掃描結果節點數極大
- **THEN** 記憶體中同時存在 Worker 組裝的樹與主執行緒 clone；沒有深度上限或符號連結循環防護
