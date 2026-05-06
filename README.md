# Guru Holdings Watch

公开访问的投资大师持仓披露追踪站。

第一版使用 Vite 静态站、GitHub Actions 定时抓取公开数据、Cloudflare Pages 发布。

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

- ARK 相关数据来自公开 ETF 持仓 CSV 与 Cathie's Ark 页面，属于交易日级别公开数据。
- SEC 13F 来自 EDGAR，通常是季度末持仓，披露存在滞后，不代表披露当天买卖。
- 本站只整理公开披露，不构成投资建议。
