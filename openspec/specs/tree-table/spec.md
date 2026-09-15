## Purpose

定義樹狀目錄表格的互動契約：麵包屑鑽取、展開與收合、名稱搜尋、欄位排序，以及列選取如何與其他視覺化共用節點。

## Requirements

### Requirement: Drill-down via double-click and breadcrumbs
系統 SHALL 允許使用者雙擊資料夾，把該資料夾設為表格的目前根；麵包屑與「上一層」按鈕 SHALL 能回到祖先路徑。

#### Scenario: Double-click directory
- **WHEN** 使用者雙擊 `kind === 'directory'` 的列
- **THEN** 表格只顯示該資料夾的子樹，麵包屑更新為從掃描根到該資料夾的路徑

#### Scenario: Navigate up
- **WHEN** 目前根不是掃描根且使用者按下上一層
- **THEN** 目前根改為父路徑（以 `/` 分割）

### Requirement: Expand, collapse, and keyboard
資料夾列 SHALL 可展開/收合。Enter 視為雙擊鑽取；方向鍵右/左 SHALL 展開/收合資料夾。

#### Scenario: Toggle expander
- **WHEN** 使用者點擊資料夾列的 chevron
- **THEN** 僅切換該路徑的展開狀態，不改變目前根

### Requirement: Name search
系統 SHALL 依檔名/資料夾名大小寫不敏感包含比對進行搜尋。搜尋時目前會遍歷目前根的整棵子樹（等於搜尋期間全部展開），沒有虛擬化。

#### Scenario: Matching names
- **WHEN** 搜尋字串非空
- **THEN** 表格列出名稱包含該字串的節點；無符合時顯示空狀態文案

#### Scenario: Clear search
- **WHEN** 使用者按下搜尋框清除按鈕
- **THEN** 搜尋字串清空，表格回到展開狀態的層級顯示

### Requirement: Sortable columns
系統 SHALL 支援依名稱、大小、檔案數、修改日期排序，同一欄再點一次切換升/降序。新欄位預設降序。

#### Scenario: Sort by size
- **WHEN** 使用者點擊「大小 / 佔用比例」欄頭且該欄已是目前排序欄
- **THEN** 排序方向反轉，子節點列表依新方向排序後再展開顯示

### Requirement: Size ratio against active root
每一列的佔用比例 SHALL 相對目前鑽取根（`activeRootNode.size`）計算，不是相對整個掃描根（除非兩者相同）。

#### Scenario: Child percentage
- **WHEN** 目前根大小大於 0
- **THEN** 列上顯示 `node.size / activeRootNode.size` 的百分比與色條（≥50% critical、≥15% warning、其餘 safe）
