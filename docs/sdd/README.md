# MacaqueTree SDD（OpenSpec）

日期：2026-09-15  
倉庫：https://github.com/tonnychiulab/macaquetree  
規格系統：[OpenSpec](https://github.com/Fission-AI/openspec)（本機 CLI 1.12.0）

本目錄是產品的 **Spec-Driven Development** 入口。行為真相在 `openspec/specs/`；今日原始碼檢測後的修正提案在 `openspec/changes/source-audit-remediation/`。

| 文件 | 內容 |
| --- | --- |
| [architecture.md](./architecture.md) | 現況架構、信任邊界、資料流 |
| [../audit/2026-09-15-source-inspection.md](../audit/2026-09-15-source-inspection.md) | 2026-09-15 原始碼檢測報告 |
| `openspec/specs/privacy-sandbox/spec.md` | 隱私與授權模型 |
| `openspec/specs/directory-scan/spec.md` | 掃描引擎（Worker + fallback） |
| `openspec/specs/tree-table/spec.md` | 樹狀表鑽取 / 搜尋 / 排序 |
| `openspec/specs/treemap/spec.md` | Treemap 視覺化（含已知缺口） |
| `openspec/specs/charts/spec.md` | 副檔名統計與 TOP 10 |
| `openspec/specs/ui-shell/spec.md` | 殼層狀態、錯誤、版本呈現 |
| `openspec/changes/source-audit-remediation/` | 修正計畫（proposal / design / specs / tasks） |

規格寫的是 **系統現況行為**（含已發現缺口）。修正變更的 delta spec 才描述目標行為；archive 後會合併回 `openspec/specs/`。
