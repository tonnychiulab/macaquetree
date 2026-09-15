# Security Policy

## Supported Versions

Only the latest published `main` branch of MacaqueTree (currently 1.x) receives security fixes. There is no separate 4.x / 5.x line.

## What this project is

MacaqueTree is a static, browser-only SPA. It has no application server, accounts, or API. Directory metadata is read in the current tab after the user grants access with File System Access API or a `webkitdirectory` picker.

## Reporting a Vulnerability

Please open a GitHub issue at https://github.com/tonnychiulab/macaquetree/issues with a reproduction and impact. Do not attach live copies of other people's files.

You should hear back within 14 days. If the report is accepted, a fix will ship on `main` and this policy will be updated if the trust model changes. If it is declined, the issue will explain why (for example: expected browser sandbox behavior, or a development-only Vite advisory that does not ship in `dist/`).
