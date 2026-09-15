## MODIFIED Requirements

### Requirement: Top 10 largest files
系統 SHALL 列出大小最大的 10 個檔案，長條寬度相對第 1 名正規化。TOP 10 與副檔名加總 SHALL 由單一次樹走訪得出，結果須等同「收集所有檔案後再排序／加總」。系統 SHALL NOT 為了排序而在記憶體再複製一份完整檔案節點清單。

#### Scenario: Fewer than ten files
- **WHEN** 檔案總數少於 10
- **THEN** 排行顯示全部檔案，不補空白列

#### Scenario: No files
- **WHEN** 樹中沒有檔案節點
- **THEN** 顯示「無檔案資料。」

#### Scenario: Ranking matches full sort
- **WHEN** 樹中有超過 10 個檔案且大小不完全相同
- **THEN** 排行的 10 個路徑與大小，與對全部檔案依大小降序排序後的前 10 名相同
