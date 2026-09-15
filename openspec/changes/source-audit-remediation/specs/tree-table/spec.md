## MODIFIED Requirements

### Requirement: Name search
系統 SHALL 依檔名／資料夾名大小寫不敏感包含比對進行搜尋。搜尋結果 SHALL 只渲染符合的節點（可附帶其相對目前根的路徑），SHALL NOT 為了搜尋而把目前根下每一個子孫列都當成可見列展開。

#### Scenario: Matching names
- **WHEN** 搜尋字串非空
- **THEN** 表格列出名稱包含該字串的節點；無符合時顯示空狀態文案

#### Scenario: Clear search
- **WHEN** 使用者按下搜尋框清除按鈕
- **THEN** 搜尋字串清空，表格回到展開狀態的層級顯示

#### Scenario: Search does not mount every descendant row
- **WHEN** 目前根含有遠多於可視區的子孫節點且使用者輸入搜尋字串
- **THEN** DOM 中的資料列數量與符合搜尋的節點數同階，而不是與整棵子樹節點數同階
