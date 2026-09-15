## Purpose

定義 MacaqueTree 的隱私與資料處理邊界：掃描只在瀏覽器本機進行，應用程式不得把使用者檔案內容或目錄結構送到遠端伺服器。

## Requirements

### Requirement: Local-only file processing
系統 SHALL 只在使用者瀏覽器程序內讀取目錄中繼資料（名稱、大小、修改時間、路徑），且 SHALL NOT 實作任何把檔案內容或掃描結果 POST/PUT 到遠端 API 的程式碼路徑。

#### Scenario: User scans a local folder
- **WHEN** 使用者選擇本機資料夾並完成掃描
- **THEN** 目錄樹只存在目前分頁的記憶體中，應用程式不發送檔案內容或掃描結果到專案自有後端

#### Scenario: User reloads the page
- **WHEN** 使用者重新載入頁面
- **THEN** 先前掃描結果消失，因為系統不把掃描結果持久化到遠端儲存

### Requirement: User-granted directory access
系統 SHALL 只在使用者透過瀏覽器權限提示明確授權後，才讀取目錄。Chrome/Edge 使用 `showDirectoryPicker({ mode: 'read' })`；不支援該 API 的瀏覽器使用 `webkitdirectory` 檔案選擇器。

#### Scenario: Chromium File System Access API
- **WHEN** `window.showDirectoryPicker` 存在且使用者選取資料夾
- **THEN** 系統以唯讀模式取得 `FileSystemDirectoryHandle` 並交給 Web Worker 掃描

#### Scenario: Fallback file picker
- **WHEN** 瀏覽器不支援 `showDirectoryPicker` 且使用者透過隱藏的 `input[webkitdirectory]` 選取資料夾
- **THEN** 系統以 `File.webkitRelativePath` 在本機組出目錄樹

### Requirement: Third-party network on first load
目前實作 SHALL 在首次載入時向 Google Fonts CDN 請求 Outfit / Plus Jakarta Sans。這與「純本機、不上傳」行銷文案不完全一致；此規格記錄現況，修正變更將收緊此要求。

#### Scenario: Cold load of the app
- **WHEN** 使用者開啟應用程式頁面
- **THEN** 瀏覽器會向 `fonts.googleapis.com` 請求 Outfit / Plus Jakarta Sans 字型
