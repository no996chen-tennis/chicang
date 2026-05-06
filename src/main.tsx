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

type Market = "us" | "cn" | "hk";
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
  staleDisclosure: boolean;
  significanceScore: number;
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
  sourceErrors: Array<{ id: string; displayName: string; error: string }>;
  sourceNotes: string[];
  officialSources?: Array<{ label: string; url: string }>;
};

const marketOrder: Market[] = ["us", "cn", "hk"];

const fallbackMarketLabels: Record<Market, string> = {
  us: "美股",
  cn: "A 股",
  hk: "港股"
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
  return event.security.ticker || event.security.name;
}

function moveLabel(move: MoveSummary) {
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
    const key =
      event.investorId === "cathie_wood"
        ? `${event.investorId}-${event.reportDate}-${event.security.ticker || event.security.name}-${event.direction}`
        : event.id;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...event,
        id: key,
        vehicleName: event.investorId === "cathie_wood" ? "ARK ETFs 汇总" : event.vehicleName,
        fundCount: event.investorId === "cathie_wood" ? 1 : undefined
      });
      continue;
    }
    existing.marketValueDelta = (existing.marketValueDelta || 0) + (event.marketValueDelta || 0);
    existing.sharesDelta = (existing.sharesDelta || 0) + (event.sharesDelta || 0);
    existing.significanceScore = (existing.significanceScore || 0) + Math.abs(event.marketValueDelta || 0);
    existing.fundCount = (existing.fundCount || 1) + 1;
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
      const limit = investorId === "cathie_wood" ? 3 : 2;
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

  const featuredEvents = useMemo(() => compactEvents(events), [events]);

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
  const headlineProfiles = profiles.slice(0, market === "us" ? 18 : 12);
  const positiveEventCount = marketEvents.filter((event) => ["new", "increase"].includes(event.direction)).length;
  const negativeEventCount = marketEvents.filter((event) => ["decrease", "closed"].includes(event.direction)).length;
  const marketLatestEventDate =
    marketEvents.map((event) => event.filingDate || event.reportDate).filter(Boolean).sort().at(-1) || null;
  const autoSourceStatus =
    market === "us"
      ? feed.stats.sourceErrorCount === 0
        ? "自动源正常"
        : `自动源 ${feed.stats.sourceErrorCount} 个异常`
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
          <span className="section-kicker">{activeMarket.label}</span>
          <h2>近期值得看</h2>
        </div>
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜人物 / 股票" />
        </div>
      </section>

      <section className="watch-panel">
        <CompactMoves events={featuredEvents} />
      </section>

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
          <small>
            1Y {formatPercent(profile.returns?.oneYearPct)} · 3Y {formatPercent(profile.returns?.threeYearPct)}
          </small>
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
              <b>{eventTicker(event)}</b>
              <span className={directionClass[event.direction]}>{directionLongText[event.direction]}</span>
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

  return (
    <div className="move-list">
      {events.map((event) => (
        <a className="move-row" key={event.id} href={event.evidenceUrl} target="_blank" rel="noreferrer">
          <span className={`direction-badge ${directionClass[event.direction]}`}>{directionText[event.direction]}</span>
          <strong>{eventTicker(event)}</strong>
          <span className="move-person">
            {event.investorName}
            <small className="move-source">{eventMeta(event)}</small>
            <small className="move-mobile-meta">
              {event.disclosedAmountRange || formatCurrency(event.marketValueDelta, "--", event.valueCurrency || "USD")} ·{" "}
              {formatDate(event.filingDate || event.reportDate, true)}
            </small>
          </span>
          <span className="move-value">
            {event.disclosedAmountRange || formatCurrency(event.marketValueDelta, "--", event.valueCurrency || "USD")}
          </span>
          <span className="move-date">{formatDate(event.filingDate || event.reportDate, true)}</span>
          <ExternalLink size={14} />
        </a>
      ))}
    </div>
  );
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
          const label = holding.ticker || holding.name;
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
