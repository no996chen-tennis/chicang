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
- A 股和港股当前是官方披露入口与观察名单，尚未自动解析事件。
- 本站只整理公开披露，不构成投资建议。
- 当前生产发布通过 Cloudflare Pages 项目 `chicang-watch`；Codex 自动任务 `chicang-daily-disclosure-update` 每天更新数据、构建并重新部署。
