import { mkdir, writeFile } from "node:fs/promises";

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT ||
  "GuruHoldingsWatch/0.1 public-data-research contact@example.com";

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
    audience: "价值投资核心关注"
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
    audience: "集中持仓与激进投资"
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
  return decodeXml(block.match(pattern)?.[1]?.trim() || "");
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
      value: valueThousands * 1000,
      shares
    });
  }
  return rows.filter((row) => row.cusip && row.name);
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
        investorId: manager.id,
        investorName: manager.displayName,
        vehicleName: manager.vehicleName,
        sourceTier: "L2",
        disclosureType: "SEC 13F",
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
        investorId: manager.id,
        investorName: manager.displayName,
        vehicleName: manager.vehicleName,
        sourceTier: "L2",
        disclosureType: "SEC 13F",
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
    displayName: manager.displayName,
    vehicleName: submission.name || manager.vehicleName,
    audience: manager.audience,
    cik: manager.cik,
    sourceTier: "L2",
    disclosureType: "SEC 13F",
    latestFiling: filings[0],
    previousFiling: filings[1],
    submissionsUrl,
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
      displayName: "Cathie Wood",
      vehicleName: "ARK Active ETFs",
      audience: "交易日级 ETF 披露",
      sourceTier: "L1",
      disclosureType: "Daily ETF holdings",
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
        investorId: "cathie_wood",
        investorName: "Cathie Wood",
        vehicleName: `${fund} / ARK Active ETFs`,
        sourceTier: "L1",
        disclosureType: "Cathie's Ark combined trades",
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

async function main() {
  await mkdir("public/data", { recursive: true });

  const generatedAt = new Date().toISOString();
  const ark = await fetchArkHoldings();
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
  const allChanges = [...ark.trades, ...secChanges]
    .sort((a, b) => {
      if (a.filingDate !== b.filingDate) return String(b.filingDate).localeCompare(String(a.filingDate));
      return b.significanceScore - a.significanceScore;
    })
    .map((event) => ({
      ...event,
      narrative: buildNarrative(event)
    }));

  const profiles = [ark.profile, ...managers].map((profile) => ({
    ...profile,
    changes: profile.changes.map((event) => ({
      ...event,
      narrative: buildNarrative(event)
    }))
  }));

  const payload = {
    generatedAt,
    site: {
      name: "Guru Holdings Watch",
      tagline: "每日检查重要投资人公开持仓披露变化",
      disclosure:
        "13F 是季度末持仓披露，通常滞后；ARK 等 ETF 数据可接近交易日级别。本站只整理公开披露，不构成投资建议。"
    },
    stats: {
      investorCount: profiles.length,
      eventCount: allChanges.length,
      arkTradeCount: ark.trades.length,
      secManagerCount: managers.length,
      sourceErrorCount: sourceErrors.length,
      latestEventDate:
        allChanges.map((event) => event.filingDate || event.reportDate).filter(Boolean).sort().at(-1) || null
    },
    profiles,
    events: allChanges.slice(0, 120),
    arkHoldings: ark.holdings.slice(0, 400),
    sourceErrors,
    sourceNotes: [
      "ARK 交易卡片来自 Cathie's Ark combined trades 页面，ARK 当前持仓来自官方 ETF CSV。",
      "SEC 13F 数值字段按官方 information table 的 value 以千美元计，页面展示已折算为美元。",
      "13F 变化按最近两个 reportDate 做差分，不代表披露日当天交易。"
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
