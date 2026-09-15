## MODIFIED Requirements

### Requirement: Indeterminate progress bar
掃描中的進度指示 SHALL 讓使用者看得出「尚未完成」。當總檔案數已知（fallback 的 `FileList.length`）時，系統 SHALL 顯示已處理件數／總件數。當總數未知（FSA 遞迴進行中）時，系統 SHALL 使用不確定進度樣式，且 SHALL NOT 把進度條畫成滿寬看起來像 100%。

#### Scenario: Scanning UI
- **WHEN** `isScanning` 為 true
- **THEN** UI 顯示已掃描檔案數、資料夾數、累積容量、估算速度（每 500ms 取 delta×2）以及目前路徑；進度列為不確定動畫，不得看起來像已完成 100%

#### Scenario: Scanning UI with unknown total
- **WHEN** File System Access Worker 掃描進行中
- **THEN** UI 顯示已掃描檔案數、資料夾數、累積容量、估算速度與目前路徑，進度列為不確定動畫而非滿寬實心條

#### Scenario: Scanning UI with known total
- **WHEN** fallback 掃描正在處理長度為 N 的 `FileList`
- **THEN** UI 顯示已處理 i／N（或同等可讀進度），i 隨處理推進

## ADDED Requirements

### Requirement: Off-main-thread fallback scan
當瀏覽器不支援 `showDirectoryPicker` 時，系統 SHALL 在 Web Worker 中從 `FileList` 組樹，主執行緒 SHALL 只處理進度、完成與錯誤訊息。組樹期間主執行緒 SHALL 保持可回應取消按鈕。

#### Scenario: Fallback processes files off the UI thread
- **WHEN** 使用者在不支援 File System Access API 的瀏覽器選取資料夾
- **THEN** 目錄樹在 Worker 組裝完成後一次（或分批進度後）交給 UI，輸入過程中頁面仍可點擊「停止掃描」

#### Scenario: Fallback omits empty folders
- **WHEN** 被選資料夾含有不含任何檔案的空目錄
- **THEN** 結果樹仍然不含該空目錄，因為 `webkitdirectory` 只提供檔案

### Requirement: Report skipped entries
Worker 掃描遇到單一檔案或子目錄讀取失敗時，系統 SHALL 略過該項目並繼續，且 SHALL 在完成（或掃描中進度）回報略過件數。略過件數大於 0 時，UI SHALL 讓使用者看得見。

#### Scenario: Locked or permission-denied file
- **WHEN** `entry.getFile()` 或子目錄遍歷拋錯
- **THEN** 該項目不進入結果樹，掃描繼續，完成後 UI 顯示略過件數至少為 1

### Requirement: Depth and cycle guards
系統 SHALL 對遞迴掃描施加最大深度（預設 64）。同一掃描中已拜訪的目錄識別不 SHALL 再進入，以避免 junction／重新解析造成的無限遞迴。超過深度的目錄 SHALL 計入略過並繼續其餘掃描。

#### Scenario: Path deeper than the limit
- **WHEN** 目錄深度超過設定上限
- **THEN** 該目錄的子層不展開，略過計數增加，祖先節點仍回傳已掃描到的內容

## REMOVED Requirements

### Requirement: Main-thread fallback scan
**Reason**: 主執行緒組樹會讓 Firefox/Safari 在大目錄時無法取消、畫面凍結，與「多執行緒掃描」產品承諾衝突。
**Migration**: 改由「Off-main-thread fallback scan」以 Worker 組樹；空目錄行為維持不變。

### Requirement: Silent skip of unreadable entries
**Reason**: 使用者無法得知權限或鎖檔造成的容量低估。
**Migration**: 改由「Report skipped entries」在 UI 顯示略過件數。
