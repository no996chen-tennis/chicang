import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Landmark,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import "./styles.css";

type Market = "us" | "cn";
type Direction = "new" | "increase" | "decrease" | "closed";

type Security = {
  ticker?: string;
  name: string;
  cusip?: string;
  title?: string;
};

type MoveSummary = {
  ticker?: string;
  name: string;
  market?: Market;
  direction: Direction;
  value?: number | null;
  valueCurrency?: string;
  date?: string | null;
  evidenceUrl?: string;
};

type HoldingEvent = {
  id: string;
  market: Market;
  investorId: string;
  investorName: string;
  vehicleName: string;
  sourceTier: string;
  disclosureType: string;
  sourceLabel?: string;
  transactionCode?: string;
  reportDate: string | null;
  filingDate: string | null;
  evidenceUrl: string;
  security: Security;
  direction: Direction;
  sharesDelta?: number | null;
  marketValueDelta?: number | null;
  valueCurrency?: string;
  disclosedAmountRange?: string;
  summaryEvents?: HoldingEvent[];
  summaryStats?: {
    increaseCount: number;
    decreaseCount: number;
    netValue: number;
  };
  staleDisclosure: boolean;
  significanceScore: number;
};

type RecentGroup = {
  id: string;
  name: string;
  source: string;
  latestDate: string | null;
  evidenceUrl: string;
  increases: HoldingEvent[];
  decreases: HoldingEvent[];
};

type Profile = {
  id: string;
  market: Market;
  displayName: string;
  vehicleName: string;
  audience: string;
  sourceTier: string;
  disclosureType: string;
  sourceLabel?: string;
  sourceUrl?: string;
  cadence?: string;
  latestFiling?: {
    form?: string;
    reportDate?: string | null;
    filingDate?: string | null;
  };
  totalValue?: number | null;
  positionCount?: number | null;
  topHoldings?: Array<{
    ticker?: string;
    name: string;
    marketValue: number;
    valueCurrency?: string;
    shares?: number | null;
    weight?: number | null;
    evidenceUrl?: string;
    holderName?: string;
    reportDate?: string | null;
  }>;
  topIncreases?: MoveSummary[];
  topDecreases?: MoveSummary[];
  returns?: {
    oneYearPct: number | null;
    threeYearPct: number | null;
    sourceLabel: string;
    sourceUrl: string | null;
    asOf: string | null;
    isProxy?: boolean;
    proxyDisclosure?: string;
  };
  changes: HoldingEvent[];
};

type MainFundFlow = {
  ticker: string;
  name: string;
  periodLabel: string;
  latestPrice?: number | null;
  pctChange?: number | null;
  mainNetInflow: number;
  mainNetInflowPct?: number | null;
  sourceLabel: string;
  evidenceUrl: string;
  asOf?: string | null;
};

type HoldingFeed = {
  generatedAt: string;
  site: {
    name: string;
    tagline: string;
    disclosure: string;
  };
  markets: Record<Market, { label: string; profileCount: number; eventCount: number }>;
  stats: {
    investorCount: number;
    eventCount: number;
    arkTradeCount: number;
    secManagerCount: number;
    congressTradeCount: number;
    form4TradeCount: number;
    regionalWatchlistCount: number;
    regionalTradeCount?: number;
    sourceErrorCount: number;
    latestEventDate: string | null;
  };
  profiles: Profile[];
  events: HoldingEvent[];
  cnMainFundInflow?: MainFundFlow[];
  sourceErrors: Array<{ id: string; displayName: string; error: string }>;
  sourceNotes: string[];
  officialSources?: Array<{ label: string; url: string }>;
};

const RECENT_WINDOW_DAYS = 30;

const marketOrder: Market[] = ["us", "cn"];

const fallbackMarketLabels: Record<Market, string> = {
  us: "美股",
  cn: "A 股"
};

const directionText: Record<Direction, string> = {
  new: "新",
  increase: "增",
  decrease: "减",
  closed: "清"
};

const directionLongText: Record<Direction, string> = {
  new: "新进",
  increase: "增持",
  decrease: "减持",
  closed: "清仓"
};

const directionClass: Record<Direction, string> = {
  new: "positive",
  increase: "positive",
  decrease: "negative",
  closed: "negative"
};

function formatCurrency(value?: number | null, fallback = "--", currency = "USD") {
  if (value === undefined || value === null || Number.isNaN(value)) return fallback;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (currency === "SHARES") {
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B股`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M股`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K股`;
    return `${sign}${abs.toFixed(0)}股`;
  }
  if (currency === "CNY") {
    if (abs >= 100_000_000) return `${sign}¥${(abs / 100_000_000).toFixed(1)}亿`;
    if (abs >= 10_000) return `${sign}¥${(abs / 10_000).toFixed(0)}万`;
    return `${sign}¥${abs.toFixed(0)}`;
  }
  const prefix = currency === "CNY" ? "¥" : currency === "HKD" ? "HK$" : "$";
  if (abs >= 1_000_000_000) return `${sign}${prefix}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${prefix}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${prefix}${(abs / 1_000).toFixed(0)}K`;
  return `${sign}${prefix}${abs.toFixed(0)}`;
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatDate(value?: string | null, compact = false) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: compact ? undefined : "2-digit",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function eventTicker(event: HoldingEvent) {
  if (event.summaryEvents?.length) return event.security.name;
  if (event.market === "cn" && event.security.ticker && event.security.name) {
    return `${event.security.ticker} ${event.security.name}`;
  }
  return event.security.ticker || event.security.name;
}

function moveLabel(move: MoveSummary) {
  if (move.market === "cn" && move.ticker && move.name) {
    return `${move.ticker} ${move.name}`;
  }
  return move.ticker || move.name;
}

function sourceName(profile: Profile) {
  return profile.sourceLabel || profile.disclosureType || profile.sourceTier;
}

function eventMeta(event: HoldingEvent) {
  if (event.investorId === "cathie_wood") {
    return `ARK ETFs · ${formatDate(event.reportDate, true)}`;
  }
  if (event.staleDisclosure) {
    return `${event.sourceLabel || event.disclosureType} · ${formatDate(event.reportDate, true)}`;
  }
  if (event.disclosedAmountRange) {
    return `${event.sourceLabel || event.disclosureType} · 区间中点估算`;
  }
  if (event.transactionCode) {
    return `${event.sourceLabel || event.disclosureType} · ${event.transactionCode}`;
  }
  return event.sourceLabel || event.disclosureType;
}

function matchesQuery(profile: Profile, query: string) {
  if (!query) return true;
  return [
    profile.displayName,
    profile.vehicleName,
    profile.audience,
    profile.sourceLabel,
    profile.disclosureType,
    ...(profile.topHoldings || []).map((holding) => `${holding.ticker || ""} ${holding.name}`)
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function compactEvents(input: HoldingEvent[]) {
  const grouped = new Map<string, HoldingEvent & { fundCount?: number }>();
  for (const event of input) {
    const key = event.investorId === "cathie_wood" ? event.investorId : event.id;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...event,
        id: key,
        security:
          event.investorId === "cathie_wood"
            ? { ...event.security, ticker: "ARK", name: "Cathie Wood 汇总" }
            : event.security,
        vehicleName: event.investorId === "cathie_wood" ? "ARK ETFs 汇总" : event.vehicleName,
        summaryEvents: event.investorId === "cathie_wood" ? [event] : undefined,
        summaryStats:
          event.investorId === "cathie_wood"
            ? {
                increaseCount: ["new", "increase"].includes(event.direction) ? 1 : 0,
                decreaseCount: ["decrease", "closed"].includes(event.direction) ? 1 : 0,
                netValue: event.marketValueDelta || 0
              }
            : undefined,
        fundCount: event.investorId === "cathie_wood" ? 1 : undefined
      });
      continue;
    }
    existing.marketValueDelta = (existing.marketValueDelta || 0) + (event.marketValueDelta || 0);
    existing.sharesDelta = (existing.sharesDelta || 0) + (event.sharesDelta || 0);
    existing.significanceScore = (existing.significanceScore || 0) + Math.abs(event.marketValueDelta || 0);
    existing.fundCount = (existing.fundCount || 1) + 1;
    existing.summaryEvents = [...(existing.summaryEvents || []), event].sort(
      (a, b) => (b.significanceScore || 0) - (a.significanceScore || 0)
    );
    existing.summaryStats = {
      increaseCount:
        (existing.summaryStats?.increaseCount || 0) + (["new", "increase"].includes(event.direction) ? 1 : 0),
      decreaseCount:
        (existing.summaryStats?.decreaseCount || 0) + (["decrease", "closed"].includes(event.direction) ? 1 : 0),
      netValue: (existing.summaryStats?.netValue || 0) + (event.marketValueDelta || 0)
    };
  }

  const sorted = Array.from(grouped.values()).sort((a, b) => {
    const aDate = a.filingDate || a.reportDate || "";
    const bDate = b.filingDate || b.reportDate || "";
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return (b.significanceScore || 0) - (a.significanceScore || 0);
  });

  const selected: HoldingEvent[] = [];
  const buckets = new Map<string, HoldingEvent[]>();
  for (const event of sorted) {
    buckets.set(event.investorId, [...(buckets.get(event.investorId) || []), event]);
  }
  const investorOrder = Array.from(buckets.keys()).sort((a, b) => {
    const firstA = buckets.get(a)?.[0];
    const firstB = buckets.get(b)?.[0];
    const dateA = firstA?.filingDate || firstA?.reportDate || "";
    const dateB = firstB?.filingDate || firstB?.reportDate || "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (firstB?.significanceScore || 0) - (firstA?.significanceScore || 0);
  });
  const byInvestor = new Map<string, number>();
  while (selected.length < 10) {
    let added = false;
    for (const investorId of investorOrder) {
      const count = byInvestor.get(investorId) || 0;
      const limit = investorId === "cathie_wood" ? 1 : 2;
      if (count >= limit) continue;
      const next = buckets.get(investorId)?.[count];
      if (!next) continue;
      selected.push(next);
      byInvestor.set(investorId, count + 1);
      added = true;
      if (selected.length >= 10) break;
    }
    if (!added) break;
  }
  if (selected.length < 10) {
    const seen = new Set(selected.map((event) => event.id));
    for (const event of sorted) {
      if (seen.has(event.id)) continue;
      selected.push(event);
      if (selected.length >= 10) break;
    }
  }
  return selected;
}

function eventTimeValue(event: HoldingEvent) {
  const rawDate = event.filingDate || event.reportDate;
  if (!rawDate) return Number.NaN;
  const parsed = Date.parse(`${rawDate}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function recentWindowEvents(input: HoldingEvent[], days = RECENT_WINDOW_DAYS) {
  const validTimes = input.map(eventTimeValue).filter(Number.isFinite);
  if (validTimes.length === 0) return input;
  const latest = Math.max(...validTimes);
  const cutoff = latest - days * 24 * 60 * 60 * 1000;
  const windowed = input.filter((event) => {
    const time = eventTimeValue(event);
    return Number.isFinite(time) && time >= cutoff && time <= latest;
  });
  return windowed.length ? windowed : input;
}

function App() {
  const [feed, setFeed] = useState<HoldingFeed | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [market, setMarket] = useState<Market>("us");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/holding-feed.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: HoldingFeed) => {
        setFeed(data);
        setStatus("ready");
      })
      .catch((error) => {
        console.error(error);
        setStatus("error");
      });
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const marketEvents = useMemo(() => {
    if (!feed) return [];
    return feed.events.filter((event) => event.market === market);
  }, [feed, market]);

  const profiles = useMemo(() => {
    if (!feed) return [];
    return feed.profiles
      .filter((profile) => profile.market === market)
      .filter((profile) => matchesQuery(profile, normalizedQuery));
  }, [feed, market, normalizedQuery]);

  const events = useMemo(() => {
    return marketEvents.filter((event) => {
      if (!normalizedQuery) return true;
      return [event.investorName, event.vehicleName, event.security.ticker, event.security.name, event.disclosureType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [marketEvents, normalizedQuery]);

  const recentEvents = useMemo(() => recentWindowEvents(events), [events]);
  const featuredEvents = useMemo(() => compactEvents(recentEvents), [recentEvents]);

  if (status === "loading") {
    return (
      <main className="loading-shell">
        <RefreshCw className="spin" size={26} />
        <span>正在载入公开披露</span>
      </main>
    );
  }

  if (status === "error" || !feed) {
    return (
      <main className="loading-shell error">
        <AlertTriangle size={26} />
        <span>数据载入失败，请稍后刷新。</span>
      </main>
    );
  }

  const activeMarket = feed.markets?.[market] || {
    label: fallbackMarketLabels[market],
    profileCount: profiles.length,
    eventCount: events.length
  };
  const headlineProfiles = profiles.slice(0, market === "us" ? 18 : 10);
  const positiveEventCount = marketEvents.filter((event) => ["new", "increase"].includes(event.direction)).length;
  const negativeEventCount = marketEvents.filter((event) => ["decrease", "closed"].includes(event.direction)).length;
  const marketLatestEventDate =
    marketEvents.map((event) => event.filingDate || event.reportDate).filter(Boolean).sort().at(-1) || null;
  const autoSourceStatus =
    market === "us"
      ? feed.stats.sourceErrorCount === 0
        ? "自动源正常"
        : `自动源 ${feed.stats.sourceErrorCount} 个异常`
      : profiles.some((profile) => (profile.topHoldings || []).length > 0 || (profile.changes || []).length > 0)
        ? "自动源正常"
        : "当前为观察名单";

  return (
    <main>
      <TopBar generatedAt={feed.generatedAt} />

      <section className="hero">
        <div className="hero-main">
          <div className="eyebrow">
            <Landmark size={16} />
            chicang 持仓雷达
          </div>
          <h1>{feed.site.tagline}</h1>
          <MarketTabs feed={feed} market={market} onChange={setMarket} />
          <NameStrip profiles={headlineProfiles} />
          <HeroPulse
            events={featuredEvents.slice(0, 3)}
            positiveCount={positiveEventCount}
            negativeCount={negativeEventCount}
          />
        </div>
        <div className="hero-side">
          <Metric label="观察对象" value={activeMarket.profileCount} />
          <Metric label="可读事件" value={activeMarket.eventCount} />
          <Metric label="最新披露" value={marketLatestEventDate ? formatDate(marketLatestEventDate, true) : "待解析"} />
        </div>
      </section>

      <section className="toolbar">
        <div>
          <span className="section-kicker">{activeMarket.label} · 近{RECENT_WINDOW_DAYS}天</span>
          <h2>近期值得看</h2>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜人物 / 股票" />
        </div>
      </section>

      <section className="watch-panel">
        <CompactMoves events={recentEvents} />
      </section>

      {market === "cn" && <MainFundFlowPanel rows={feed.cnMainFundInflow || []} />}

      <section className="profiles-section">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Tracked</span>
            <h2>跟踪的机构和个人</h2>
          </div>
          <span className="freshness">{autoSourceStatus}</span>
        </div>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      </section>

      <section className="sources">
        <div className="source-copy">
          <span className="section-kicker">Sources</span>
          <h2>数据边界</h2>
          <p>{feed.site.disclosure}</p>
        </div>
        <div className="source-list">
          {feed.sourceNotes.slice(0, 4).map((note) => (
            <div className="source-note" key={note}>
              <ShieldCheck size={17} />
              <span>{note}</span>
            </div>
          ))}
          {(feed.officialSources || []).slice(0, 6).map((source) => (
            <a className="source-link" key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function TopBar({ generatedAt }: { generatedAt: string }) {
  return (
    <header className="topbar">
      <a className="brand" href="#">
        <Landmark size={21} />
        <span>chicang</span>
      </a>
      <div className="topbar-meta">
        <RefreshCw size={15} />
        <span>{formatDate(generatedAt)}</span>
      </div>
    </header>
  );
}

function MarketTabs({
  feed,
  market,
  onChange
}: {
  feed: HoldingFeed;
  market: Market;
  onChange: (market: Market) => void;
}) {
  return (
    <div className="market-tabs" aria-label="市场切换">
      {marketOrder.map((item) => {
        const meta = feed.markets?.[item];
        return (
          <button key={item} className={market === item ? "active" : ""} type="button" onClick={() => onChange(item)}>
            <span>{meta?.label || fallbackMarketLabels[item]}</span>
            <b>{meta?.profileCount ?? 0}</b>
          </button>
        );
      })}
    </div>
  );
}

function NameStrip({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="name-strip">
      {profiles.map((profile) => (
        <span className="name-pill" key={profile.id}>
          <b>{profile.displayName}</b>
          <small>近一年业绩 {formatPercent(profile.returns?.oneYearPct)}</small>
        </span>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HeroPulse({
  events,
  positiveCount,
  negativeCount
}: {
  events: HoldingEvent[];
  positiveCount: number;
  negativeCount: number;
}) {
  return (
    <div className="hero-pulse">
      <div className="pulse-score">
        <span>
          <TrendingUp size={15} />
          增/新 {positiveCount}
        </span>
        <span>
          <TrendingDown size={15} />
          减/清 {negativeCount}
        </span>
      </div>
      <div className="pulse-feed">
        {events.length === 0 ? (
          <span className="pulse-empty">暂无可核验变化</span>
        ) : (
          events.map((event) => (
            <a key={event.id} href={event.evidenceUrl} target="_blank" rel="noreferrer">
              <b>{event.summaryEvents?.length ? "Cathie Wood" : eventTicker(event)}</b>
              <span
                className={
                  event.summaryEvents?.length
                    ? (event.marketValueDelta || 0) >= 0
                      ? "positive"
                      : "negative"
                    : directionClass[event.direction]
                }
              >
                {event.summaryEvents?.length ? "ARK 汇总" : directionLongText[event.direction]}
              </span>
              <small>{formatCurrency(event.marketValueDelta, "--", event.valueCurrency || "USD")}</small>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

function CompactMoves({ events }: { events: HoldingEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="empty-state">
        这个市场当前仅展示官方披露入口和观察名单，尚未自动解析事件。
      </div>
    );
  }

  const groups = groupRecentEvents(events);

  return (
    <div className="move-list">
      {groups.map((group) => (
        <RecentInvestorCard key={group.id} group={group} />
      ))}
    </div>
  );
}

function groupRecentEvents(events: HoldingEvent[]) {
  const groups = new Map<string, RecentGroup>();
  for (const event of events) {
    const sourceEvents = event.summaryEvents?.length ? event.summaryEvents : [event];
    const key = event.investorId === "cathie_wood" ? "cathie_wood" : `${event.investorId}:${event.investorName}`;
    const existing =
      groups.get(key) ||
      {
        id: key,
        name: event.investorId === "cathie_wood" ? "Cathie Wood" : event.investorName,
        source: event.investorId === "cathie_wood" ? "ARK ETFs 汇总" : event.sourceLabel || event.disclosureType,
        latestDate: event.filingDate || event.reportDate,
        evidenceUrl: event.evidenceUrl,
        increases: [],
        decreases: []
      };
    for (const item of sourceEvents) {
      if (["new", "increase"].includes(item.direction)) existing.increases.push(item);
      if (["decrease", "closed"].includes(item.direction)) existing.decreases.push(item);
      const itemDate = item.filingDate || item.reportDate;
      if (itemDate && (!existing.latestDate || itemDate > existing.latestDate)) existing.latestDate = itemDate;
    }
    existing.increases.sort((a, b) => (b.significanceScore || 0) - (a.significanceScore || 0));
    existing.decreases.sort((a, b) => (b.significanceScore || 0) - (a.significanceScore || 0));
    groups.set(key, existing);
  }

  return Array.from(groups.values())
    .filter((group) => group.increases.length || group.decreases.length)
    .sort((a, b) => {
      if (a.latestDate !== b.latestDate) return String(b.latestDate).localeCompare(String(a.latestDate));
      const aScore = [...a.increases, ...a.decreases][0]?.significanceScore || 0;
      const bScore = [...b.increases, ...b.decreases][0]?.significanceScore || 0;
      return bScore - aScore;
    })
    .slice(0, 10);
}

function RecentInvestorCard({ group }: { group: RecentGroup }) {
  const columnCount = Number(group.increases.length > 0) + Number(group.decreases.length > 0);
  return (
    <article className="recent-card">
      <div className="recent-head">
        <div>
          <h3>{group.name}</h3>
          <p>{group.source} · {formatDate(group.latestDate, true)}</p>
        </div>
        <a href={group.evidenceUrl} target="_blank" rel="noreferrer" aria-label={`${group.name} 来源`}>
          <ExternalLink size={15} />
        </a>
      </div>
      <div className={`recent-move-columns ${columnCount === 1 ? "single" : ""}`}>
        {group.increases.length > 0 && <RecentMoveList title="增持" events={group.increases} tone="positive" />}
        {group.decreases.length > 0 && <RecentMoveList title="减持" events={group.decreases} tone="negative" />}
      </div>
    </article>
  );
}

function RecentMoveList({
  title,
  events,
  tone
}: {
  title: string;
  events: HoldingEvent[];
  tone: "positive" | "negative";
}) {
  const Icon = tone === "positive" ? ArrowUpRight : ArrowDownRight;
  const displayEvents = uniqueRecentMoves(events).slice(0, 4);
  return (
    <div className={`recent-move-list ${tone}`}>
      <span className="recent-move-title">
        <Icon size={14} />
        {title}
      </span>
      <div>
        {displayEvents.map((event) => (
          <a key={event.id} href={event.evidenceUrl} target="_blank" rel="noreferrer">
            <span>{eventTicker(event)}</span>
            <small>
              {event.disclosedAmountRange || formatCurrency(event.marketValueDelta, "", event.valueCurrency || "USD")}
            </small>
          </a>
        ))}
      </div>
    </div>
  );
}

function MainFundFlowPanel({ rows }: { rows: MainFundFlow[] }) {
  if (rows.length === 0) return null;
  const period = rows[0]?.periodLabel || "近10日";
  return (
    <section className="fund-flow-section">
      <div className="section-title-row compact">
        <div>
          <span className="section-kicker">A 股 · {period}</span>
          <h2>主力净流入</h2>
        </div>
        <a className="freshness source-anchor" href={rows[0].evidenceUrl} target="_blank" rel="noreferrer">
          {rows[0].sourceLabel}
          <ExternalLink size={14} />
        </a>
      </div>
      <div className="fund-flow-grid">
        {rows.slice(0, 10).map((row, index) => (
          <a key={`${row.ticker}-${index}`} className="fund-flow-card" href={row.evidenceUrl} target="_blank" rel="noreferrer">
            <span className="fund-rank">{index + 1}</span>
            <div className="fund-security">
              <strong>{row.ticker}</strong>
              <span>{row.name}</span>
            </div>
            <b>{formatCurrency(row.mainNetInflow, "--", "CNY")}</b>
            <small>
              涨跌 {formatPercent(row.pctChange)} · 净占比 {formatPercent(row.mainNetInflowPct)}
            </small>
          </a>
        ))}
      </div>
    </section>
  );
}

function uniqueRecentMoves(events: HoldingEvent[]) {
  const seen = new Set<string>();
  const unique: HoldingEvent[] = [];
  for (const event of events) {
    const key = [
      event.security.ticker || event.security.name,
      event.direction,
      event.disclosedAmountRange || Math.round(event.marketValueDelta || 0),
      event.filingDate || event.reportDate
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(event);
  }
  return unique;
}

function ProfileCard({ profile }: { profile: Profile }) {
  const increased = profile.topIncreases || [];
  const decreased = profile.topDecreases || [];
  return (
    <article className="profile-card">
      <div className="profile-head">
        <div>
          <h3>{profile.displayName}</h3>
          <p>{profile.vehicleName}</p>
        </div>
        <span className="tier">{profile.sourceTier}</span>
      </div>
      <div className="profile-tags">
        <span>{sourceName(profile)}</span>
        <span>{profile.cadence || profile.disclosureType}</span>
      </div>
      <div className="profile-scan">
        <div className="return-row">
          <ReturnCell label="1Y" value={profile.returns?.oneYearPct} />
          <ReturnCell label="3Y" value={profile.returns?.threeYearPct} />
        </div>
        <HoldingChips holdings={profile.topHoldings || []} />
        <div className="move-stack">
          <MoveChips title="增持 Top3" moves={increased} tone="positive" />
          <MoveChips title="减持 Top3" moves={decreased} tone="negative" />
        </div>
      </div>
      <small className="return-source">
        {profile.returns?.sourceLabel || profile.returns?.proxyDisclosure || "收益率待接入"}
      </small>
      {increased.length === 0 && decreased.length === 0 && (
        <div className="pending-note">已列入官方披露入口；当前仅作人工跟踪清单，尚未自动解析事件。</div>
      )}
    </article>
  );
}

function HoldingChips({ holdings }: { holdings: NonNullable<Profile["topHoldings"]> }) {
  if (holdings.length === 0) {
    return <div className="holding-empty">前三大持仓待解析</div>;
  }
  return (
    <div className="holding-chips">
      <span className="holding-title">前三大持仓</span>
      <div>
        {holdings.slice(0, 3).map((holding, index) => {
          const label =
            holding.ticker && /^\d/.test(holding.ticker) ? `${holding.ticker} ${holding.name}` : holding.ticker || holding.name;
          const value =
            holding.weight !== undefined && holding.weight !== null
              ? `${holding.weight.toFixed(1)}%`
              : formatCurrency(holding.marketValue || holding.shares, "", holding.valueCurrency || "USD");
          const content = (
            <>
              <span>{label}</span>
              <small>{value}</small>
            </>
          );
          return holding.evidenceUrl ? (
            <a key={`${label}-${index}`} href={holding.evidenceUrl} target="_blank" rel="noreferrer">
              {content}
            </a>
          ) : (
            <span key={`${label}-${index}`}>{content}</span>
          );
        })}
      </div>
    </div>
  );
}

function ReturnCell({ label, value }: { label: string; value?: number | null }) {
  return (
    <div>
      <span>{label}</span>
      <strong className={value && value < 0 ? "negative-text" : value && value > 0 ? "positive-text" : ""}>
        {formatPercent(value)}
      </strong>
    </div>
  );
}

function MoveChips({ title, moves, tone }: { title: string; moves: MoveSummary[]; tone: "positive" | "negative" }) {
  if (moves.length === 0) return null;
  const Icon = tone === "positive" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={`move-chips ${tone}`}>
      <span className="chip-title">
        <Icon size={14} />
        {title}
      </span>
      <div>
        {moves.slice(0, 3).map((move, index) => (
          <a key={`${moveLabel(move)}-${move.date}-${index}`} href={move.evidenceUrl} target="_blank" rel="noreferrer">
            <span>{moveLabel(move)}</span>
            <small>{formatCurrency(move.value, "", move.valueCurrency || "USD")}</small>
          </a>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
