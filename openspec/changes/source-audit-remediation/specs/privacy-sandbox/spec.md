## MODIFIED Requirements

### Requirement: Third-party network on first load
系統 SHALL NOT 在首次載入時向第三方 CDN 請求字型或追蹤腳本。字型 SHALL 使用系統字型堆疊（或之後若 self-host，必須來自同源靜態資產）。應用程式邏輯仍 SHALL NOT 上傳檔案內容或掃描結果。

#### Scenario: Cold load of the app
- **WHEN** 使用者開啟應用程式頁面且尚未選擇資料夾
- **THEN** 文件與腳本請求只打向應用程式的同源 origin（以及瀏覽器對該 origin 的靜態資產），沒有 `fonts.googleapis.com` 或同等第三方字型主機的請求

## ADDED Requirements

### Requirement: Privacy copy matches actual network behavior
歡迎頁與 README 的隱私說明 SHALL 只陳述系統實際做到的事：本機掃描、不上傳檔案內容與掃描樹；SHALL NOT 使用「100% 不上網」這類與頁面自身靜態託管事實衝突的絕對句。

#### Scenario: Welcome security hint
- **WHEN** 使用者看到歡迎頁的安全提示
- **THEN** 文案說明檔案中繼資料只在本機處理、沒有上傳邏輯，並可提及託管該靜態頁的主機仍會送出 HTML/JS
