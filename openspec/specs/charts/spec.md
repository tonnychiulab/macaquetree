## Purpose

定義掃描完成後的副檔名佔用統計：環形圖前五名、最大檔案 TOP 10 長條，以及可捲動的詳細副檔名表，讓使用者快速找到空間殺手。

## Requirements

### Requirement: Aggregate files by extension
系統 SHALL 遞迴走訪掃描樹中所有 `kind === 'file'` 的節點，依 `extension`（無副檔名則為 `.unknown`）加總大小與數量。

#### Scenario: Build extension stats
- **WHEN** Charts 分頁首次以某個 `rootNode` 渲染
- **THEN** 詳細表依累積大小降序列出每個副檔名的分類、數量、大小、佔根節點比例

### Requirement: Ring chart top extensions
環形圖 SHALL 顯示大小最大的 5 個副檔名，其餘合併為「其他檔案 (Others)」（佔比須大於 0.1% 才顯示）。

#### Scenario: More than five extensions
- **WHEN** 副檔名種類超過 5
- **THEN** 圖例含前 5 名加上 Others，Others 大小為 `rootNode.size - 前5名合計`

### Requirement: Top 10 largest files
系統 SHALL 列出大小最大的 10 個檔案，長條寬度相對第 1 名正規化。目前實作會先把所有檔案放進陣列再排序，沒有 bounded heap。

#### Scenario: Fewer than ten files
- **WHEN** 檔案總數少於 10
- **THEN** 排行顯示全部檔案，不補空白列

#### Scenario: No files
- **WHEN** 樹中沒有檔案節點
- **THEN** 顯示「無檔案資料。」
