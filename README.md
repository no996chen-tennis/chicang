# chicang

公开访问的投资大师持仓披露追踪站。

第一版使用 Vite 静态站、GitHub Actions 定时抓取公开数据、Cloudflare Pages 发布。

线上地址：https://chicang-watch.pages.dev/

## 本地运行

```bash
npm install
npm run data:update
npm run dev
```

## 构建

```bash
npm run check
```

## 数据边界

- ARK 当前持仓来自官方 ETF holdings CSV；交易卡片暂由 Cathie's Ark 第三方索引解析。
- SEC 13F 来自 EDGAR，通常是季度末持仓，披露存在滞后，不代表披露当天买卖；数值按 filing 原始 information table 的 value 字段展示。
- 美国国会议员 PTR 使用第三方索引发现记录，但每条事件必须保留 House Clerk 或 Senate eFD 官方 evidence URL。
- A 股使用东方财富股东分析结构化索引补充前十大股东持仓和变动；原始事实仍来自上市公司定期报告。
- 港股当前仅展示 HKEX Stock Connect 南向持股；没有自动解析结果的 DI 观察项不放进页面。
- GitHub 上可复用的数据项目：`akfamily/akshare` 覆盖 A 股股东分析接口；`timothycarambat/senate-stock-watcher-data` 可作为美国参议员 PTR 开放数据参考。
- 本站只整理公开披露，不构成投资建议。
- 当前生产发布通过 Cloudflare Pages 项目 `chicang-watch`；Codex 自动任务 `chicang-daily-disclosure-update` 每天更新数据、构建并重新部署。

## GitHub Actions 发布

`.github/workflows/update-data.yml` 已支持定时抓取、构建、提交数据，并在配置了以下仓库 secrets 后自动发布到 Cloudflare Pages：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

如果未配置 secrets，GitHub Actions 仍会每天更新并提交 `public/data/holding-feed.json`，但不会发布到 Cloudflare。
