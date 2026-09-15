## Purpose

定義 WinDirStat 風格 SVG Treemap：以區塊面積表示容量、依副檔名著色、懸停顯示詳情，並說明目前點選與尚未實作的雙擊鑽取行為。

## Requirements

### Requirement: Slice-and-dice layout
系統 SHALL 用遞迴 slice-and-dice（非 squarified）把 `rootNode` 佈局到固定 viewBox `800×450`。面積為 0 的子節點不繪製。寬或高小於 25px、或節點為檔案/無子節點時，該區塊視為葉子。

#### Scenario: Render after scan
- **WHEN** 掃描完成且使用者切到 Treemap 分頁
- **THEN** SVG 顯示以掃描根為範圍的區塊圖，檔案色依副檔名、資料夾為半透明藍

### Requirement: Click selects, hover shows tooltip
點擊區塊 SHALL 呼叫 `onSelectNode`。滑鼠懸停 SHALL 顯示名稱、路徑、類型、大小、相對掃描根的比例。目前沒有雙擊鑽取實作，儘管 UI 說明文字寫了「雙擊資料夾區塊可進入檢視」。

#### Scenario: Select a rectangle
- **WHEN** 使用者點擊某個區塊
- **THEN** 該節點成為 `selectedNode`，區塊出現強調描邊

#### Scenario: Double-click directory rectangle
- **WHEN** 使用者雙擊資料夾區塊
- **THEN** 目前行為不變（不會進入該資料夾）；這是規格記錄的現況缺口，將由修正變更補上

### Requirement: Independent of tree-table focus
Treemap 目前永遠以 App 傳入的掃描 `rootNode` 佈局，SHALL NOT 跟隨 Tree Table 的麵包屑鑽取根。

#### Scenario: User drills down in table then switches tab
- **WHEN** 使用者在樹狀表鑽取到子資料夾後切換到 Treemap
- **THEN** Treemap 仍顯示整個掃描根，而不是表格目前根
