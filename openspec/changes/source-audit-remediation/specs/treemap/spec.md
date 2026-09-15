## MODIFIED Requirements

### Requirement: Click selects, hover shows tooltip
點擊區塊 SHALL 呼叫選取回呼。滑鼠懸停 SHALL 顯示名稱、路徑、類型、大小、相對目前佈局根的比例。雙擊資料夾區塊 SHALL 把該資料夾設為目前焦點路徑（與樹狀表鑽取相同）。雙擊檔案區塊 SHALL 只維持選取，不改變焦點路徑。

#### Scenario: Select a rectangle
- **WHEN** 使用者點擊某個區塊
- **THEN** 該節點成為選取節點，區塊出現強調描邊

#### Scenario: Double-click directory rectangle
- **WHEN** 使用者雙擊資料夾區塊
- **THEN** Treemap 改為以該資料夾為佈局根重算區塊，且樹狀表的目前根與麵包屑同步到同一路徑

## ADDED Requirements

### Requirement: Layout follows focused directory
Treemap 的佈局根 SHALL 為目前焦點路徑對應的目錄節點；若焦點為掃描根或尚未鑽取，則使用掃描根。

#### Scenario: User drills down in table then switches tab
- **WHEN** 使用者在樹狀表鑽取到子資料夾後切換到 Treemap
- **THEN** Treemap 顯示該子資料夾的容量分佈，而不是整個掃描根

## REMOVED Requirements

### Requirement: Independent of tree-table focus
**Reason**: 兩個視覺化使用不同的「目前根」會讓分頁切換後迷路，也讓 README 的鑽取描述無法成立。
**Migration**: 改由「Layout follows focused directory」與 ui-shell 的共用焦點路徑。
