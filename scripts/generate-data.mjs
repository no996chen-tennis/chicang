import { mkdir, writeFile } from "node:fs/promises";

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT ||
  "chicang/0.2 public-data-research contact@example.com";

const ARK_FUNDS = [
  {
    id: "arkk",
    ticker: "ARKK",
    name: "ARK Innovation ETF",
    url: "https://assets.ark-funds.com/fund-documents/funds-etf-csv/ARK_INNOVATION_ETF_ARKK_HOLDINGS.csv"
  },
  {
    id: "arkq",
    ticker: "ARKQ",
    name: "ARK Autonomous Tech. & Robotics ETF",
    url: "https://assets.ark-funds.com/fund-documents/funds-etf-csv/ARK_AUTONOMOUS_TECH._%26_ROBOTICS_ETF_ARKQ_HOLDINGS.csv"
  },
  {
    id: "arkw",
    ticker: "ARKW",
    name: "ARK Next Generation Internet ETF",
    url: "https://assets.ark-funds.com/fund-documents/funds-etf-csv/ARK_NEXT_GENERATION_INTERNET_ETF_ARKW_HOLDINGS.csv"
  },
  {
    id: "arkg",
    ticker: "ARKG",
    name: "ARK Genomic Revolution ETF",
    url: "https://assets.ark-funds.com/fund-documents/funds-etf-csv/ARK_GENOMIC_REVOLUTION_ETF_ARKG_HOLDINGS.csv"
  },
  {
    id: "arkf",
    ticker: "ARKF",
    name: "ARK Fintech Innovation ETF",
    url: "https://assets.ark-funds.com/fund-documents/funds-etf-csv/ARK_FINTECH_INNOVATION_ETF_ARKF_HOLDINGS.csv"
  },
  {
    id: "arkx",
    ticker: "ARKX",
    name: "ARK Space Exploration & Innovation ETF",
    url: "https://assets.ark-funds.com/fund-documents/funds-etf-csv/ARK_SPACE_EXPLORATION_%26_INNOVATION_ETF_ARKX_HOLDINGS.csv"
  }
];

const SEC_MANAGERS = [
  {
    id: "berkshire_hathaway",
    displayName: "Warren Buffett",
    vehicleName: "Berkshire Hathaway Inc",
    cik: "0001067983",
    audience: "价值投资核心关注",
    performanceProxy: {
      ticker: "BRK.B",
      assetClass: "stocks",
      label: "BRK.B 股价代理，非 Buffett / Berkshire 13F 组合真实净值"
    }
  },
  {
    id: "scion_asset_management",
    displayName: "Michael Burry",
    vehicleName: "Scion Asset Management, LLC",
    cik: "0001649339",
    audience: "高话题度集中组合"
  },
  {
    id: "pershing_square",
    displayName: "Bill Ackman",
    vehicleName: "Pershing Square Capital Management, L.P.",
    cik: "0001336528",
    audience: "集中持仓与激进投资",
    performanceProxy: {
      ticker: "PSHZF",
      assetClass: "stocks",
      label: "PSHZF 市价代理，非 Pershing Square Capital Management 真实基金净值"
    }
  },
  {
    id: "duquesne_family_office",
    displayName: "Stanley Druckenmiller",
    vehicleName: "Duquesne Family Office LLC",
    cik: "0001536411",
    audience: "宏观资金风向"
  },
  {
    id: "bridgewater",
    displayName: "Ray Dalio",
    vehicleName: "Bridgewater Associates, LP",
    cik: "0001350694",
    audience: "宏观资产配置"
  },
  {
    id: "baupost",
    displayName: "Seth Klarman",
    vehicleName: "Baupost Group LLC",
    cik: "0001061768",
    audience: "深度价值投资"
  },
  {
    id: "himalaya_capital",
    displayName: "李录",
    vehicleName: "Himalaya Capital Management LLC",
    cik: "0001709323",
    audience: "中文价值投资关注"
  },
  {
    id: "hhlr_advisors",
    displayName: "张磊 / 高瓴",
    vehicleName: "HHLR Advisors, Ltd.",
    cik: "0001762304",
    audience: "中概、科技、医药"
  },
  {
    id: "hh_international",
    displayName: "段永平",
    vehicleName: "H&H International Investment, LLC",
    cik: "0001759760",
    audience: "中文长期价值投资"
  },
  {
    id: "oriental_harbor",
    displayName: "但斌",
    vehicleName: "Oriental Harbor Investment Master Fund",
    cik: "0002046333",
    audience: "中文私募代表"
  },
  {
    id: "tiger_global",
    displayName: "Chase Coleman",
    vehicleName: "Tiger Global Management LLC",
    cik: "0001167483",
    audience: "成长股与互联网"
  },
  {
    id: "coatue",
    displayName: "Philippe Laffont",
    vehicleName: "Coatue Management LLC",
    cik: "0001135730",
    audience: "科技成长股"
  },
  {
    id: "lone_pine",
    displayName: "Stephen Mandel",
    vehicleName: "Lone Pine Capital LLC",
    cik: "0001061165",
    audience: "成长股精选"
  },
  {
    id: "third_point",
    displayName: "Dan Loeb",
    vehicleName: "Third Point LLC",
    cik: "0001040273",
    audience: "事件驱动与激进投资"
  }
];

const US_INSIDER_COMPANIES = [
  { id: "tesla_insiders", ticker: "TSLA", name: "Tesla", cik: "0001318605" },
  { id: "nvidia_insiders", ticker: "NVDA", name: "NVIDIA", cik: "0001045810" },
  { id: "meta_insiders", ticker: "META", name: "Meta", cik: "0001326801" },
  { id: "microsoft_insiders", ticker: "MSFT", name: "Microsoft", cik: "0000789019" },
  { id: "apple_insiders", ticker: "AAPL", name: "Apple", cik: "0000320193" },
  { id: "amazon_insiders", ticker: "AMZN", name: "Amazon", cik: "0001018724" }
];

const REGIONAL_WATCHLISTS = [
  {
    id: "cn_gaoyi_assets",
    market: "cn",
    displayName: "高毅资产 / 冯柳 / 邓晓峰",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "高关注度私募持仓线索",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "http://www.cninfo.com.cn/new/disclosure",
    sourceLabel: "巨潮资讯 / 交易所定期报告",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_social_security_fund",
    market: "cn",
    displayName: "全国社保基金",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "长期资金配置变化",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "http://www.cninfo.com.cn/new/disclosure",
    sourceLabel: "巨潮资讯 / 交易所定期报告",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_central_huijin",
    market: "cn",
    displayName: "中央汇金 / 汇金资管",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "国家队持仓变化",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "http://www.cninfo.com.cn/new/disclosure",
    sourceLabel: "巨潮资讯 / 上交所 / 深交所",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_china_securities_finance",
    market: "cn",
    displayName: "中国证券金融股份有限公司",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "市场稳定资金线索",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "https://www.sse.com.cn/disclosure/listedinfo/regular/",
    sourceLabel: "交易所定期报告",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_ge_weidong",
    market: "cn",
    displayName: "葛卫东",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "个人大户持仓变化",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "http://www.cninfo.com.cn/new/disclosure",
    sourceLabel: "巨潮资讯 / 交易所定期报告",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_linyuan",
    market: "cn",
    displayName: "林园系产品",
    vehicleName: "A 股上市公司前十大股东线索",
    audience: "公开前十大股东线索",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "http://www.cninfo.com.cn/new/disclosure",
    sourceLabel: "巨潮资讯 / 交易所定期报告",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_danshuiquan",
    market: "cn",
    displayName: "淡水泉 / 赵军",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "成长价值风格私募",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "https://www.szse.cn/disclosure/listed/fixed/index.html",
    sourceLabel: "深交所 / 巨潮资讯",
    cadence: "定期报告披露后"
  },
  {
    id: "cn_jinglin_assets",
    market: "cn",
    displayName: "景林资产",
    vehicleName: "A 股定期报告前十大股东线索",
    audience: "消费与互联网风格资金",
    sourceTier: "Watchlist",
    disclosureType: "定期报告十大股东",
    sourceUrl: "http://www.cninfo.com.cn/new/disclosure",
    sourceLabel: "巨潮资讯 / 交易所定期报告",
    cadence: "定期报告披露后"
  },
  {
    id: "hk_li_ka_shing",
    market: "hk",
    displayName: "李嘉诚家族",
    vehicleName: "长和系 / 长实系权益披露",
    audience: "港股核心家族资本动向",
    sourceTier: "Watchlist",
    disclosureType: "HKEX DI notices",
    sourceUrl: "https://di.hkex.com.hk/filing/di/NSSrchMethod.aspx?lang=EN&src=MAIN",
    sourceLabel: "HKEX Disclosure of Interests",
    cadence: "事件触发"
  },
  {
    id: "hk_tencent_prosus",
    market: "hk",
    displayName: "Prosus / Naspers",
    vehicleName: "腾讯主要股东权益披露",
    audience: "腾讯大股东减持节奏",
    sourceTier: "Watchlist",
    disclosureType: "HKEX DI notices",
    sourceUrl: "https://di.hkex.com.hk/filing/di/NSSrchMethod.aspx?lang=EN&src=MAIN",
    sourceLabel: "HKEX Disclosure of Interests",
    cadence: "事件触发"
  },
  {
    id: "hk_hillhouse",
    market: "hk",
    displayName: "高瓴 / Hillhouse",
    vehicleName: "港股主要股东权益披露",
    audience: "医疗、消费、科技持仓线索",
    sourceTier: "Watchlist",
    disclosureType: "HKEX DI notices",
    sourceUrl: "https://di.hkex.com.hk/filing/di/NSSrchMethod.aspx?lang=EN&src=MAIN",
    sourceLabel: "HKEX Disclosure of Interests",
    cadence: "事件触发"
  },
  {
    id: "hk_blackrock_jpm",
    market: "hk",
    displayName: "国际大行主要股东 DI",
    vehicleName: "BlackRock / JPMorgan 等港股权益披露",
    audience: "国际长线资金阈值变动",
    sourceTier: "Watchlist",
    disclosureType: "HKEX DI notices",
    sourceUrl: "https://di.hkex.com.hk/filing/di/NSSrchMethod.aspx?lang=EN&src=MAIN",
    sourceLabel: "HKEX Disclosure of Interests",
    cadence: "事件触发"
  },
  {
    id: "hk_southbound",
    market: "hk",
    displayName: "南向资金 / 港股通",
    vehicleName: "HKEX Stock Connect holdings",
    audience: "内地资金配置变化",
    sourceTier: "Watchlist",
    disclosureType: "Stock Connect 持股披露",
    sourceUrl: "https://www3.hkexnews.hk/sdw/search/mutualmarket.aspx?t=hk",
    sourceLabel: "HKEX Stock Connect Shareholding",
    cadence: "交易日"
  }
];

const CUSIP_TICKERS = {
  "037833100": "AAPL",
  "02079K107": "GOOG",
  "02079K305": "GOOGL",
  "594918104": "MSFT",
  "023135106": "AMZN",
  "30303M102": "META",
  "88160R101": "TSLA",
  "67066G104": "NVDA",
  "01609W102": "BABA",
  "060505104": "BAC",
  "17275R102": "CSCO",
  "191216100": "KO",
  "46625H100": "JPM",
  "478160104": "JNJ",
  "717081103": "PFE",
  "92343V104": "VZ",
  "92826C839": "V",
  "931142103": "WMT",
  "084670702": "BRK.B",
  "883556102": "TMO",
  "007903107": "AMD",
  "69608A108": "PLTR",
  "19260Q107": "COIN",
  "79466L302": "CRM"
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(url, options = {}, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": SEC_USER_AGENT,
        accept: "text/html,application/xhtml+xml,application/xml,text/csv,application/json;q=0.9,*/*;q=0.8",
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return {
      text: await response.text(),
      headers: response.headers,
      url: response.url
    };
  } catch (error) {
    if (attempt < 3) {
      await sleep(500 * attempt);
      return fetchText(url, options, attempt + 1);
    }
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function htmlDecode(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/<!-- -->/g, "");
}

function stripHtml(value = "") {
  return htmlDecode(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function parseUsDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value} UTC`);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString().slice(0, 10);
}

function midpointFromRange(value) {
  const numbers = String(value || "")
    .match(/\$?[\d,]+/g)
    ?.map((item) => Number(item.replace(/[$,]/g, "")))
    .filter((item) => Number.isFinite(item));
  if (!numbers?.length) return null;
  if (numbers.length === 1) return numbers[0];
  return (numbers[0] + numbers[1]) / 2;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers = [], ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), values[index]?.trim() ?? ""]))
  );
}

function numberFrom(value) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/[$,%",]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeXml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlValue(block, tagName) {
  const pattern = new RegExp(`<(?:\\w+:)?${tagName}>([\\s\\S]*?)<\\/(?:\\w+:)?${tagName}>`, "i");
  const inner = block.match(pattern)?.[1]?.trim() || "";
  const value = inner.match(/<value>([\s\S]*?)<\/value>/i)?.[1]?.trim() || inner;
  return decodeXml(value.replace(/<[^>]*>/g, "").trim());
}

function parse13fInformationTable(xml) {
  const rows = [];
  const tablePattern = /<(?:\w+:)?infoTable>([\s\S]*?)<\/(?:\w+:)?infoTable>/gi;
  let match;
  while ((match = tablePattern.exec(xml))) {
    const block = match[1];
    const cusip = xmlValue(block, "cusip");
    const valueThousands = numberFrom(xmlValue(block, "value")) || 0;
    const shares = numberFrom(xmlValue(block, "sshPrnamt")) || 0;
    const name = xmlValue(block, "nameOfIssuer");
    rows.push({
      cusip,
      ticker: CUSIP_TICKERS[cusip] || "",
      name,
      title: xmlValue(block, "titleOfClass"),
      value: valueThousands,
      shares
    });
  }
  const grouped = new Map();
  for (const row of rows.filter((item) => item.cusip && item.name)) {
    const key = `${row.cusip}-${row.title}`;
    const existing = grouped.get(key) || {
      ...row,
      value: 0,
      shares: 0
    };
    existing.value += row.value;
    existing.shares += row.shares;
    grouped.set(key, existing);
  }
  return Array.from(grouped.values());
}

function normalizeFilingRecords(submission) {
  const recent = submission.filings?.recent || {};
  const records = [];
  for (let index = 0; index < (recent.form?.length || 0); index += 1) {
    const form = recent.form[index];
    const reportDate = recent.reportDate?.[index];
    if (!/^13F/.test(form) || !reportDate) continue;
    records.push({
      form,
      reportDate,
      filingDate: recent.filingDate[index],
      accessionNumber: recent.accessionNumber[index],
      primaryDocument: recent.primaryDocument[index]
    });
  }

  const byReportDate = new Map();
  for (const record of records) {
    const existing = byReportDate.get(record.reportDate);
    if (!existing || record.filingDate > existing.filingDate || /\/A$/.test(record.form)) {
      byReportDate.set(record.reportDate, record);
    }
  }

  return Array.from(byReportDate.values()).sort((a, b) => {
    if (a.reportDate !== b.reportDate) return b.reportDate.localeCompare(a.reportDate);
    return b.filingDate.localeCompare(a.filingDate);
  });
}

function secArchiveBase(cik, accessionNumber) {
  return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accessionNumber.replaceAll("-", "")}`;
}

async function fetch13fTable(cik, filing) {
  const base = secArchiveBase(cik, filing.accessionNumber);
  const index = JSON.parse((await fetchText(`${base}/index.json`)).text);
  const items = index.directory?.item || [];
  const xmlItem =
    items.find((item) => /info.?table.*\.xml$/i.test(item.name)) ||
    items.find((item) => /\.xml$/i.test(item.name) && !/primary/i.test(item.name));
  if (!xmlItem) {
    throw new Error(`No information table XML for ${filing.accessionNumber}`);
  }
  const url = `${base}/${xmlItem.name}`;
  const xml = (await fetchText(url)).text;
  return {
    url,
    rows: parse13fInformationTable(xml)
  };
}

function build13fChanges(manager, latest, previous, latestRows, previousRows, evidenceUrl) {
  const previousByCusip = new Map(previousRows.map((row) => [row.cusip, row]));
  const latestByCusip = new Map(latestRows.map((row) => [row.cusip, row]));
  const changes = [];

  for (const row of latestRows) {
    const before = previousByCusip.get(row.cusip);
    const sharesBefore = before?.shares || 0;
    const valueBefore = before?.value || 0;
    const sharesDelta = row.shares - sharesBefore;
    const valueDelta = row.value - valueBefore;
    if (!before || Math.abs(sharesDelta) > 0) {
      changes.push({
        id: `${manager.id}-${row.cusip}-${latest.reportDate}`,
        market: "us",
        investorId: manager.id,
        investorName: manager.displayName,
        vehicleName: manager.vehicleName,
        sourceTier: "L2",
        disclosureType: "SEC 13F",
        sourceLabel: "SEC EDGAR",
        reportDate: latest.reportDate,
        previousReportDate: previous.reportDate,
        filingDate: latest.filingDate,
        accessionNumber: latest.accessionNumber,
        evidenceUrl,
        security: {
          ticker: row.ticker,
          name: row.name,
          cusip: row.cusip,
          title: row.title
        },
        direction: before ? (sharesDelta > 0 ? "increase" : "decrease") : "new",
        sharesBefore,
        sharesAfter: row.shares,
        sharesDelta,
        marketValueBefore: valueBefore,
        marketValueAfter: row.value,
        marketValueDelta: valueDelta,
        significanceScore: Math.abs(valueDelta) || row.value,
        confidence: "high",
        staleDisclosure: true
      });
    }
  }

  for (const row of previousRows) {
    if (!latestByCusip.has(row.cusip)) {
      changes.push({
        id: `${manager.id}-${row.cusip}-${latest.reportDate}-closed`,
        market: "us",
        investorId: manager.id,
        investorName: manager.displayName,
        vehicleName: manager.vehicleName,
        sourceTier: "L2",
        disclosureType: "SEC 13F",
        sourceLabel: "SEC EDGAR",
        reportDate: latest.reportDate,
        previousReportDate: previous.reportDate,
        filingDate: latest.filingDate,
        accessionNumber: latest.accessionNumber,
        evidenceUrl,
        security: {
          ticker: row.ticker,
          name: row.name,
          cusip: row.cusip,
          title: row.title
        },
        direction: "closed",
        sharesBefore: row.shares,
        sharesAfter: 0,
        sharesDelta: -row.shares,
        marketValueBefore: row.value,
        marketValueAfter: 0,
        marketValueDelta: -row.value,
        significanceScore: row.value,
        confidence: "high",
        staleDisclosure: true
      });
    }
  }

  return changes.sort((a, b) => b.significanceScore - a.significanceScore);
}

async function fetchSecManager(manager) {
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${manager.cik}.json`;
  const submission = JSON.parse((await fetchText(submissionsUrl)).text);
  const filings = normalizeFilingRecords(submission);
  if (filings.length < 2) {
    throw new Error(`Need at least two 13F filings for ${manager.displayName}`);
  }

  await sleep(140);
  const latestTable = await fetch13fTable(manager.cik, filings[0]);
  await sleep(140);
  const previousTable = await fetch13fTable(manager.cik, filings[1]);
  const changes = build13fChanges(
    manager,
    filings[0],
    filings[1],
    latestTable.rows,
    previousTable.rows,
    latestTable.url
  );

  const totalValue = latestTable.rows.reduce((sum, row) => sum + row.value, 0);
  const topHoldings = latestTable.rows
    .map((row) => ({
      ticker: row.ticker,
      name: row.name,
      cusip: row.cusip,
      title: row.title,
      shares: row.shares,
      marketValue: row.value,
      weight: totalValue > 0 ? (row.value / totalValue) * 100 : null
    }))
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 8);

  return {
    id: manager.id,
    market: "us",
    displayName: manager.displayName,
    vehicleName: submission.name || manager.vehicleName,
    audience: manager.audience,
    cik: manager.cik,
    sourceTier: "L2",
    disclosureType: "SEC 13F",
    sourceLabel: "SEC EDGAR",
    sourceUrl: submissionsUrl,
    cadence: "季度",
    performanceProxy: manager.performanceProxy,
    latestFiling: filings[0],
    previousFiling: filings[1],
    totalValue,
    positionCount: latestTable.rows.length,
    topHoldings,
    changes: changes.slice(0, 10)
  };
}

async function fetchArkHoldings() {
  const holdings = [];
  const fundStatuses = [];

  for (const fund of ARK_FUNDS) {
    const response = await fetchText(fund.url, {
      headers: {
        accept: "text/csv,*/*"
      }
    });
    const rows = parseCsv(response.text);
    const parsed = rows
      .map((row) => ({
        investorId: "cathie_wood",
        investorName: "Cathie Wood",
        vehicleName: fund.ticker,
        fund: fund.ticker,
        fundName: fund.name,
        date: normalizeArkDate(row.date),
        ticker: row.ticker,
        name: row.company,
        cusip: row.cusip,
        shares: numberFrom(row.shares) || 0,
        marketValue: numberFrom(row["market value ($)"]) || 0,
        weight: numberFrom(row["weight (%)"]) || 0,
        sourceUrl: fund.url
      }))
      .filter((row) => row.ticker && row.name);

    holdings.push(...parsed);
    fundStatuses.push({
      id: fund.id,
      ticker: fund.ticker,
      name: fund.name,
      rowCount: parsed.length,
      asOfDate: parsed[0]?.date || null,
      lastModified: response.headers.get("last-modified"),
      url: fund.url
    });
  }

  const combined = new Map();
  for (const row of holdings) {
    const existing =
      combined.get(row.ticker) ||
      {
        ticker: row.ticker,
        name: row.name,
        marketValue: 0,
        shares: 0,
        funds: new Set(),
        maxWeight: 0
      };
    existing.marketValue += row.marketValue;
    existing.shares += row.shares;
    existing.funds.add(row.fund);
    existing.maxWeight = Math.max(existing.maxWeight, row.weight || 0);
    combined.set(row.ticker, existing);
  }

  const topHoldings = Array.from(combined.values())
    .map((row) => ({
      ...row,
      funds: Array.from(row.funds).sort()
    }))
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 18);

  const trades = await fetchCathiesArkTrades();

  return {
    profile: {
      id: "cathie_wood",
      market: "us",
      displayName: "Cathie Wood",
      vehicleName: "ARK Active ETFs",
      audience: "交易日级 ETF 披露",
      sourceTier: "L1",
      disclosureType: "Daily ETF holdings",
      sourceLabel: "ARK official ETF holdings CSV",
      sourceUrl: "https://ark-funds.com/funds/arkk/",
      cadence: "交易日",
      performanceProxy: {
        ticker: "ARKK",
        assetClass: "etf",
        label: "ARKK ETF 市价代理，非 Cathie Wood 全部管理资产真实净值"
      },
      latestFiling: {
        reportDate: fundStatuses.map((fund) => fund.asOfDate).filter(Boolean).sort().at(-1) || null,
        filingDate: fundStatuses.map((fund) => fund.lastModified).filter(Boolean).sort().at(-1) || null,
        form: "ARK ETF CSV"
      },
      topHoldings,
      fundStatuses,
      changes: trades.slice(0, 12)
    },
    holdings,
    trades
  };
}

function normalizeArkDate(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value || null;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

async function fetchCathiesArkTrades() {
  try {
    const html = (await fetchText("https://cathiesark.com/ark-funds-combined/trades")).text;
    const unescaped = html.replace(/\\"/g, '"').replace(/\\u0026/g, "&");
    const pattern =
      /\{"date":"\$D([^"]+)","pretty_date":"([^"]+)","fund":"([^"]+)","ticker":"([^"]+)","weight":(-?\d+(?:\.\d+)?),"company_name":"([^"]*)","direction":"(Buy|Sell)","shares":(-?\d+(?:\.\d+)?),"market_value":(-?\d+(?:\.\d+)?),"percent_of_position":(-?\d+(?:\.\d+)?),"is_new_position":(true|false)\}/g;
    const seen = new Set();
    const trades = [];
    let match;
    while ((match = pattern.exec(unescaped))) {
      const [
        ,
        rawDate,
        prettyDate,
        fund,
        ticker,
        weight,
        companyName,
        direction,
        shares,
        marketValue,
        percentOfPosition,
        isNewPosition
      ] = match;
      const id = `cathiesark-${rawDate}-${fund}-${ticker}-${direction}-${shares}`;
      if (seen.has(id)) continue;
      seen.add(id);
      trades.push({
        id,
        market: "us",
        investorId: "cathie_wood",
        investorName: "Cathie Wood",
        vehicleName: `${fund} / ARK Active ETFs`,
        sourceTier: "L1-derived",
        disclosureType: "Cathie's Ark combined trades",
        sourceLabel: "Cathie's Ark third-party index",
        indexSourceLabel: "Cathie's Ark third-party index",
        reportDate: rawDate.slice(0, 10),
        previousReportDate: null,
        filingDate: rawDate.slice(0, 10),
        evidenceUrl: "https://cathiesark.com/ark-funds-combined/trades",
        security: {
          ticker,
          name: companyName,
          cusip: "",
          title: ""
        },
        direction: direction === "Buy" ? "increase" : "decrease",
        sharesBefore: null,
        sharesAfter: null,
        sharesDelta: Number(shares) * (direction === "Buy" ? 1 : -1),
        marketValueBefore: null,
        marketValueAfter: null,
        marketValueDelta: Number(marketValue) * (direction === "Buy" ? 1 : -1),
        weightPctDelta: Number(weight) * (direction === "Buy" ? 1 : -1),
        percentOfPosition: Number(percentOfPosition),
        isNewPosition: isNewPosition === "true",
        prettyDate,
        significanceScore: Math.abs(Number(marketValue)),
        confidence: "medium",
        staleDisclosure: false
      });
    }
    return trades.sort((a, b) => {
      if (a.reportDate !== b.reportDate) return b.reportDate.localeCompare(a.reportDate);
      return b.significanceScore - a.significanceScore;
    });
  } catch (error) {
    console.warn(`Cathie's Ark parser skipped: ${error.message}`);
    return [];
  }
}

async function fetchCongressTrades() {
  try {
    const html = (await fetchText("https://congressflow.com/trades")).text;
    const rows = [...html.matchAll(/<tr class="border-b border-gray-800\/50[\s\S]*?<\/tr>/g)]
      .map((match) => match[0])
      .slice(0, 60);
    const events = [];

    for (const row of rows) {
      const cells = [...row.matchAll(/<td[\s\S]*?<\/td>/g)].map((match) => match[0]);
      const filed = parseUsDate(stripHtml(cells[0] || ""));
      const traded = parseUsDate(stripHtml(cells[1] || ""));
      const politician = stripHtml(row.match(/<span class="text-\[#f1f5f9\]">([\s\S]*?)<\/span>/)?.[1] || "");
      const ticker = row.match(/href="\/stock\/([^"]+)"/)?.[1] || "";
      const txType = stripHtml(cells[4] || "");
      const amountText = stripHtml(cells[5] || "");
      const evidenceUrl =
        row.match(/href="(https:\/\/(?:efdsearch\.senate\.gov|disclosures-clerk\.house\.gov)[^"]+)"/)?.[1] || "";
      if (!filed || !traded || !politician || !ticker || !evidenceUrl) continue;
      if (!["Buy", "Sell"].includes(txType)) continue;

      const midpoint = midpointFromRange(amountText);
      const direction = txType === "Buy" ? "increase" : "decrease";
      events.push({
        id: `congress-${filed}-${traded}-${politician.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${ticker}-${txType}`,
        market: "us",
        investorId: "us_congress",
        investorName: politician,
        vehicleName: "US Congress PTR",
        sourceTier: "L1",
        disclosureType: "STOCK Act PTR",
        sourceLabel: evidenceUrl.includes("senate.gov") ? "Senate eFD PTR" : "House Clerk PTR",
        indexSourceLabel: "CongressFlow third-party index",
        reportDate: traded,
        previousReportDate: null,
        filingDate: filed,
        evidenceUrl,
        security: {
          ticker,
          name: ticker,
          cusip: "",
          title: "Disclosed range"
        },
        direction,
        sharesBefore: null,
        sharesAfter: null,
        sharesDelta: null,
        marketValueBefore: null,
        marketValueAfter: null,
        marketValueDelta: midpoint ? midpoint * (direction === "increase" ? 1 : -1) : null,
        disclosedAmountRange: amountText,
        significanceScore: midpoint || 0,
        confidence: "medium",
        staleDisclosure: false
      });
    }

    const unique = new Map(events.map((event) => [event.id, event]));
    const changes = Array.from(unique.values()).sort((a, b) => {
      if (a.filingDate !== b.filingDate) return String(b.filingDate).localeCompare(String(a.filingDate));
      return b.significanceScore - a.significanceScore;
    });

    return {
      profile: {
        id: "us_congress",
        market: "us",
        displayName: "美国国会议员",
        vehicleName: "House / Senate Periodic Transaction Reports",
        audience: "STOCK Act 交易披露",
        sourceTier: "L1",
        disclosureType: "STOCK Act PTR",
        sourceLabel: "Official PTR evidence via House Clerk / Senate eFD",
        sourceUrl: "https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure",
        indexSourceUrl: "https://congressflow.com/trades",
        officialSources: [
          "https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure",
          "https://efts.senate.gov/LATEST/search-index?q=%22%22&type=ptr"
        ],
        cadence: "披露后更新",
        latestFiling: {
          form: "PTR",
          reportDate: changes[0]?.reportDate || null,
          filingDate: changes[0]?.filingDate || null
        },
        positionCount: changes.length,
        changes: changes.slice(0, 24)
      },
      changes
    };
  } catch (error) {
    console.warn(`Congress PTR parser skipped: ${error.message}`);
    return {
      profile: {
        id: "us_congress",
        market: "us",
        displayName: "美国国会议员",
        vehicleName: "House / Senate Periodic Transaction Reports",
        audience: "STOCK Act 交易披露",
        sourceTier: "Watchlist",
        disclosureType: "STOCK Act PTR",
        sourceLabel: "Official PTR evidence via House Clerk / Senate eFD",
        sourceUrl: "https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure",
        indexSourceUrl: "https://congressflow.com/trades",
        cadence: "披露后更新",
        changes: []
      },
      changes: [],
      error
    };
  }
}

function latestForm4Record(submission) {
  const recent = submission.filings?.recent || {};
  for (let index = 0; index < (recent.form?.length || 0); index += 1) {
    if (recent.form[index] !== "4" && recent.form[index] !== "4/A") continue;
    return {
      form: recent.form[index],
      reportDate: recent.reportDate[index],
      filingDate: recent.filingDate[index],
      accessionNumber: recent.accessionNumber[index],
      primaryDocument: recent.primaryDocument[index]
    };
  }
  return null;
}

async function fetchOwnershipXml(cik, filing) {
  const base = secArchiveBase(cik, filing.accessionNumber);
  const index = JSON.parse((await fetchText(`${base}/index.json`)).text);
  const items = index.directory?.item || [];
  const primaryName = filing.primaryDocument?.split("/").at(-1);
  const xmlItem =
    items.find((item) => item.name === primaryName) ||
    items.find((item) => /\.xml$/i.test(item.name) && !/primary/i.test(item.name));
  if (!xmlItem) throw new Error(`No Form 4 XML for ${filing.accessionNumber}`);
  const url = `${base}/${xmlItem.name}`;
  return {
    url,
    xml: (await fetchText(url)).text
  };
}

async function fetchInsiderProfile() {
  const changes = [];
  const latestFilings = [];
  for (const company of US_INSIDER_COMPANIES) {
    try {
      await sleep(140);
      const submission = JSON.parse(
        (await fetchText(`https://data.sec.gov/submissions/CIK${company.cik}.json`)).text
      );
      const filing = latestForm4Record(submission);
      if (!filing) continue;
      await sleep(140);
      const { url, xml } = await fetchOwnershipXml(company.cik, filing);
      const owner = xmlValue(xml, "rptOwnerName") || "Company insider";
      const issuerName = xmlValue(xml, "issuerName") || submission.name || company.name;
      const issuerTicker = xmlValue(xml, "issuerTradingSymbol") || company.ticker;
      const transactions = [...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g)];

      for (const transaction of transactions) {
        const block = transaction[1];
        const code = xmlValue(block, "transactionCode");
        if (!["P", "S"].includes(code)) continue;
        const shares = numberFrom(xmlValue(block, "transactionShares"));
        const price = numberFrom(xmlValue(block, "transactionPricePerShare"));
        const transactionDate = xmlValue(block, "transactionDate") || filing.reportDate;
        const direction = code === "P" ? "increase" : "decrease";
        changes.push({
          id: `form4-${company.ticker}-${filing.accessionNumber}-${transactionDate}-${code}-${shares || 0}`,
          market: "us",
          investorId: "us_corporate_insiders",
          investorName: owner,
          vehicleName: `${issuerTicker} insider`,
          sourceTier: "L1",
          disclosureType: "SEC Form 4",
          sourceLabel: "SEC EDGAR Form 4",
          transactionCode: code,
          reportDate: transactionDate,
          previousReportDate: null,
          filingDate: filing.filingDate,
          accessionNumber: filing.accessionNumber,
          evidenceUrl: url,
          security: {
            ticker: issuerTicker,
            name: issuerName,
            cusip: "",
            title: "Common stock"
          },
          direction,
          sharesBefore: null,
          sharesAfter: null,
          sharesDelta: shares ? shares * (direction === "increase" ? 1 : -1) : null,
          marketValueBefore: null,
          marketValueAfter: null,
          marketValueDelta: shares && price ? shares * price * (direction === "increase" ? 1 : -1) : null,
          significanceScore: shares && price ? shares * price : 0,
          confidence: "high",
          staleDisclosure: false
        });
      }
      latestFilings.push({ company, filing });
    } catch (error) {
      console.warn(`Skipped ${company.name} Form 4: ${error.message}`);
    }
  }

  const sorted = changes.sort((a, b) => {
    if (a.filingDate !== b.filingDate) return String(b.filingDate).localeCompare(String(a.filingDate));
    return b.significanceScore - a.significanceScore;
  });

  return {
    profile: {
      id: "us_corporate_insiders",
      market: "us",
      displayName: "美国上市公司高管",
      vehicleName: "SEC Form 4 insider transactions",
      audience: "核心科技公司高管买卖",
      sourceTier: "L1",
      disclosureType: "SEC Form 4",
      sourceLabel: "SEC EDGAR",
      sourceUrl: "https://www.sec.gov/edgar/search/",
      cadence: "通常交易后 2 个工作日内",
      latestFiling: {
        form: "4",
        reportDate: sorted[0]?.reportDate || null,
        filingDate: sorted[0]?.filingDate || null
      },
      positionCount: US_INSIDER_COMPANIES.length,
      topHoldings: US_INSIDER_COMPANIES.map((company) => ({
        ticker: company.ticker,
        name: company.name,
        marketValue: 0,
        weight: null
      })),
      changes: sorted.slice(0, 18)
    },
    changes: sorted,
    latestFilings
  };
}

function directionLabel(direction) {
  return (
    {
      new: "新进",
      increase: "增持",
      decrease: "减持",
      closed: "清仓"
    }[direction] || direction
  );
}

function buildNarrative(event) {
  const name = event.security.ticker
    ? `${event.security.ticker} / ${event.security.name}`
    : `${event.security.name}`;
  const stale = event.staleDisclosure
    ? `报告期 ${event.reportDate}，披露日 ${event.filingDate}`
    : `交易日 ${event.reportDate}`;
  return `${event.investorName} 通过 ${event.vehicleName} ${directionLabel(event.direction)} ${name}。${stale}。`;
}

function emptyReturns(reason = "暂无可核验公开净值") {
  return {
    oneYearPct: null,
    threeYearPct: null,
    sourceLabel: reason,
    sourceUrl: null,
    asOf: null
  };
}

function isoDateFromNasdaq(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[1]}-${match[2]}`;
}

function daysAgoIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function closeValue(value) {
  return numberFrom(String(value || "").replace("$", ""));
}

function closestOnOrBefore(rows, targetDate) {
  return rows
    .filter((row) => row.isoDate <= targetDate)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate))[0];
}

async function fetchProxyReturns(proxy) {
  if (!proxy?.ticker) return emptyReturns();
  try {
    const todate = new Date().toISOString().slice(0, 10);
    const fromdate = daysAgoIso(1125);
    const url = `https://api.nasdaq.com/api/quote/${encodeURIComponent(proxy.ticker)}/historical?assetclass=${proxy.assetClass || "stocks"}&fromdate=${fromdate}&todate=${todate}&limit=1200`;
    const response = JSON.parse(
      (
        await fetchText(url, {
          headers: {
            "user-agent": "Mozilla/5.0 chicang public-data-research"
          }
        })
      ).text
    );
    const rows = (response.data?.tradesTable?.rows || [])
      .map((row) => ({
        isoDate: isoDateFromNasdaq(row.date),
        close: closeValue(row.close)
      }))
      .filter((row) => row.isoDate && row.close);
    const latest = rows.sort((a, b) => b.isoDate.localeCompare(a.isoDate))[0];
    if (!latest) return emptyReturns(`${proxy.label} 暂无价格数据`);
    const oneYear = closestOnOrBefore(rows, daysAgoIso(365));
    const threeYear = closestOnOrBefore(rows, daysAgoIso(1095));
    const pct = (base) => (base?.close ? ((latest.close - base.close) / base.close) * 100 : null);
    return {
      oneYearPct: pct(oneYear),
      threeYearPct: pct(threeYear),
      sourceLabel: proxy.label || `${proxy.ticker} 价格代理`,
      sourceUrl: `https://www.nasdaq.com/market-activity/${proxy.assetClass === "etf" ? "etf" : "stocks"}/${proxy.ticker.toLowerCase()}/historical`,
      asOf: latest.isoDate,
      isProxy: true,
      proxyDisclosure: "价格代理，不代表管理人真实组合净值、基金 NAV 或私募产品收益"
    };
  } catch (error) {
    return emptyReturns(`${proxy.label || proxy.ticker} 价格代理暂不可用`);
  }
}

function topMoves(changes, directions) {
  return [...(changes || [])]
    .filter((event) => directions.includes(event.direction))
    .sort((a, b) => (b.significanceScore || 0) - (a.significanceScore || 0))
    .slice(0, 3)
    .map((event) => ({
      ticker: event.security.ticker || "",
      name: event.security.name,
      direction: event.direction,
      value: ["decrease", "closed"].includes(event.direction)
        ? -Math.abs(event.significanceScore ?? event.marketValueDelta ?? 0)
        : Math.abs(event.significanceScore ?? event.marketValueDelta ?? 0),
      date: event.filingDate || event.reportDate || null,
      evidenceUrl: event.evidenceUrl
    }));
}

async function enrichProfile(profile) {
  const changes = (profile.changes || []).map((event) => ({
    ...event,
    narrative: buildNarrative(event)
  }));
  return {
    ...profile,
    changes,
    topIncreases: topMoves(changes, ["new", "increase"]),
    topDecreases: topMoves(changes, ["decrease", "closed"]),
    returns: await fetchProxyReturns(profile.performanceProxy)
  };
}

function regionalProfile(item) {
  return {
    ...item,
    latestFiling: {
      form: item.disclosureType,
      reportDate: null,
      filingDate: null
    },
    totalValue: null,
    positionCount: null,
    topHoldings: [],
    changes: [],
    topIncreases: [],
    topDecreases: [],
    returns: emptyReturns("公开披露无统一净值")
  };
}

async function main() {
  await mkdir("public/data", { recursive: true });

  const generatedAt = new Date().toISOString();
  const ark = await fetchArkHoldings();
  const congress = await fetchCongressTrades();
  const insiders = await fetchInsiderProfile();
  const managers = [];
  const sourceErrors = [];

  for (const manager of SEC_MANAGERS) {
    try {
      await sleep(180);
      managers.push(await fetchSecManager(manager));
      console.log(`Fetched ${manager.displayName}`);
    } catch (error) {
      console.warn(`Skipped ${manager.displayName}: ${error.message}`);
      sourceErrors.push({
        id: manager.id,
        displayName: manager.displayName,
        error: error.message
      });
    }
  }

  const secChanges = managers.flatMap((manager) => manager.changes);
  const allChanges = [...ark.trades, ...secChanges, ...congress.changes, ...insiders.changes]
    .sort((a, b) => {
      if (a.filingDate !== b.filingDate) return String(b.filingDate).localeCompare(String(a.filingDate));
      return b.significanceScore - a.significanceScore;
    })
    .map((event) => ({
      ...event,
      narrative: buildNarrative(event)
    }));

  if (congress.error) {
    sourceErrors.push({
      id: "us_congress",
      displayName: "美国国会议员",
      error: congress.error.message
    });
  }

  const profiles = await Promise.all(
    [ark.profile, ...managers, congress.profile, insiders.profile, ...REGIONAL_WATCHLISTS.map(regionalProfile)].map(
      enrichProfile
    )
  );

  const markets = {
    us: {
      label: "美股",
      profileCount: profiles.filter((profile) => profile.market === "us").length,
      eventCount: allChanges.filter((event) => event.market === "us").length
    },
    cn: {
      label: "A 股",
      profileCount: profiles.filter((profile) => profile.market === "cn").length,
      eventCount: allChanges.filter((event) => event.market === "cn").length
    },
    hk: {
      label: "港股",
      profileCount: profiles.filter((profile) => profile.market === "hk").length,
      eventCount: allChanges.filter((event) => event.market === "hk").length
    }
  };

  const payload = {
    generatedAt,
    site: {
      name: "chicang",
      tagline: "重要资金公开披露雷达",
      disclosure:
        "只展示可追溯到公开披露或官方链接的数据。美股已自动解析 ARK、SEC 13F、PTR、Form 4；A 股和港股当前为官方披露入口与观察名单。本站不构成投资建议。"
    },
    markets,
    stats: {
      investorCount: profiles.length,
      eventCount: allChanges.length,
      arkTradeCount: ark.trades.length,
      secManagerCount: managers.length,
      congressTradeCount: congress.changes.length,
      form4TradeCount: insiders.changes.length,
      regionalWatchlistCount: REGIONAL_WATCHLISTS.length,
      sourceErrorCount: sourceErrors.length,
      latestEventDate:
        allChanges.map((event) => event.filingDate || event.reportDate).filter(Boolean).sort().at(-1) || null
    },
    profiles,
    events: allChanges.slice(0, 120),
    arkHoldings: ark.holdings.slice(0, 400),
    sourceErrors,
    sourceNotes: [
      "ARK 当前持仓来自 ARK 官方 ETF holdings CSV；交易卡片暂由 Cathie's Ark 第三方索引解析，非 ARK 官方交易清单。",
      "SEC 13F 数值按 filing 原始 information table 的 value 字段展示并保留 evidence URL；本站不做千美元二次放大。",
      "13F 变化按最近两个 reportDate 做差分，不代表披露日当天交易。",
      "PTR 列表解析使用 CongressFlow 第三方索引；每条入库记录必须有 House Clerk 或 Senate eFD 官方 evidence URL，否则丢弃。金额为申报区间中点估算，不是精确成交额。",
      "SEC Form 4 仅展示 non-derivative transactionCode=P/S 的公开市场买入/卖出；排除 A/M/F/G/J 等授予、期权行权、税务卖出、赠与或其他交易。",
      "A 股与港股当前仅列出官方披露入口和观察对象，尚未自动解析持仓变化事件。",
      "1Y/3Y 为可交易证券价格代理，不代表管理人真实组合净值、基金 NAV 或私募产品收益。"
    ],
    officialSources: [
      {
        label: "House Clerk Financial Disclosure",
        url: "https://disclosures-clerk.house.gov/PublicDisclosure/FinancialDisclosure"
      },
      {
        label: "Senate eFD PTR",
        url: "https://efts.senate.gov/LATEST/search-index?q=%22%22&type=ptr"
      },
      {
        label: "SEC EDGAR APIs",
        url: "https://www.sec.gov/edgar/sec-api-documentation"
      },
      {
        label: "SEC EDGAR Search",
        url: "https://www.sec.gov/edgar/search/"
      },
      {
        label: "巨潮资讯披露入口",
        url: "http://www.cninfo.com.cn/new/disclosure"
      },
      {
        label: "上交所定期报告",
        url: "https://www.sse.com.cn/disclosure/listedinfo/regular/"
      },
      {
        label: "深交所定期报告",
        url: "https://www.szse.cn/disclosure/listed/fixed/index.html"
      },
      {
        label: "HKEX Disclosure of Interests",
        url: "https://di.hkex.com.hk/filing/di/NSSrchMethod.aspx?lang=EN&src=MAIN"
      },
      {
        label: "HKEX Stock Connect Shareholding",
        url: "https://www3.hkexnews.hk/sdw/search/mutualmarket.aspx?t=hk"
      },
      {
        label: "OGE public financial disclosure",
        url: "https://www2.oge.gov/web/oge.nsf/publicresources_FOIA-landing"
      }
    ]
  };

  await writeFile("public/data/holding-feed.json", `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Wrote public/data/holding-feed.json with ${payload.events.length} events, ${profiles.length} profiles`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
