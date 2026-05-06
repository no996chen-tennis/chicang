import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ExternalLink,
  Landmark,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import "./styles.css";

type Direction = "new" | "increase" | "decrease" | "closed";

type Security = {
  ticker?: string;
  name: string;
  cusip?: string;
  title?: string;
};

type HoldingEvent = {
  id: string;
  investorId: string;
  investorName: string;
  vehicleName: string;
  sourceTier: "L1" | "L2" | string;
  disclosureType: string;
  reportDate: string | null;
  previousReportDate?: string | null;
  filingDate: string | null;
  evidenceUrl: string;
  security: Security;
  direction: Direction;
  sharesDelta?: number | null;
  sharesAfter?: number | null;
  marketValueDelta?: number | null;
  marketValueAfter?: number | null;
  weightPctDelta?: number | null;
  confidence: string;
  staleDisclosure: boolean;
  significanceScore: number;
  narrative: string;
};

type Profile = {
  id: string;
  displayName: string;
  vehicleName: string;
  audience: string;
  cik?: string;
  sourceTier: "L1" | "L2" | string;
  disclosureType: string;
  latestFiling?: {
    form?: string;
    reportDate?: string | null;
    filingDate?: string | null;
  };
  totalValue?: number;
  positionCount?: number;
  topHoldings?: Array<{
    ticker?: string;
    name: string;
    cusip?: string;
    marketValue: number;
    weight?: number | null;
    funds?: string[];
  }>;
  changes: HoldingEvent[];
};

type HoldingFeed = {
  generatedAt: string;
  site: {
    name: string;
    tagline: string;
    disclosure: string;
  };
  stats: {
    investorCount: number;
    eventCount: number;
    arkTradeCount: number;
    secManagerCount: number;
    sourceErrorCount: number;
    latestEventDate: string | null;
  };
  profiles: Profile[];
  events: HoldingEvent[];
  sourceErrors: Array<{ id: string; displayName: string; error: string }>;
  sourceNotes: string[];
};

const directionText: Record<string, string> = {
  new: "新进",
  increase: "增持",
  decrease: "减持",
  closed: "清仓"
};

const directionClass: Record<string, string> = {
  new: "positive",
  increase: "positive",
  decrease: "negative",
  closed: "negative"
};

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "未披露";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "未披露";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "未披露";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function securityLabel(event: HoldingEvent) {
  return event.security.ticker
    ? `${event.security.ticker} · ${event.security.name}`
    : `${event.security.name}`;
}

function App() {
  const [feed, setFeed] = useState<HoldingFeed | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<"all" | "L1" | "L2">("all");

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

  const filteredEvents = useMemo(() => {
    if (!feed) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return feed.events.filter((event) => {
      const matchesTier = tier === "all" || event.sourceTier === tier;
      const haystack = [
        event.investorName,
        event.vehicleName,
        event.security.ticker,
        event.security.name,
        event.security.cusip,
        event.disclosureType
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesTier && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [feed, query, tier]);

  if (status === "loading") {
    return (
      <main className="loading-shell">
        <RefreshCw className="spin" size={28} />
        <span>正在载入公开披露数据</span>
      </main>
    );
  }

  if (status === "error" || !feed) {
    return (
      <main className="loading-shell error">
        <AlertTriangle size={28} />
        <span>数据载入失败，请稍后刷新。</span>
      </main>
    );
  }

  const l1Count = feed.events.filter((event) => event.sourceTier === "L1").length;
  const l2Count = feed.events.filter((event) => event.sourceTier === "L2").length;

  return (
    <main>
      <TopBar generatedAt={feed.generatedAt} />
      <section className="hero-band">
        <div className="content-grid hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={16} />
              公开持仓披露雷达
            </div>
            <h1>重要投资人持仓变化，一屏看清。</h1>
            <p>
              每天检查 ARK 交易日数据与 SEC 13F 季度披露，聚合 Cathie Wood、巴菲特、Burry、李录、张磊、段永平、但斌等重点人物。
            </p>
            <div className="hero-actions">
              <a className="primary-link" href="#events">
                查看变化
                <ArrowDownRight size={18} />
              </a>
              <a className="secondary-link" href="#sources">
                数据边界
                <ShieldCheck size={18} />
              </a>
            </div>
          </div>
          <SignalPanel feed={feed} l1Count={l1Count} l2Count={l2Count} />
        </div>
      </section>

      <section className="summary-band">
        <div className="content-grid stats-grid">
          <Metric label="跟踪人物/机构" value={feed.stats.investorCount} helper="可继续扩展" />
          <Metric label="近期变化事件" value={feed.stats.eventCount} helper="按重要性排序" />
          <Metric label="ARK 交易卡片" value={feed.stats.arkTradeCount} helper="交易日级别" />
          <Metric label="13F 管理人" value={feed.stats.secManagerCount} helper="季度披露" />
        </div>
      </section>

      <section className="content-band" id="events">
        <div className="section-head">
          <div>
            <span className="section-kicker">Today Watch</span>
            <h2>近期值得看的披露变化</h2>
          </div>
          <div className="search-cluster">
            <div className="search-box">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索人物、股票、CUSIP"
              />
            </div>
            <div className="segmented" aria-label="Source tier filter">
              {(["all", "L1", "L2"] as const).map((value) => (
                <button
                  key={value}
                  className={tier === value ? "active" : ""}
                  type="button"
                  onClick={() => setTier(value)}
                >
                  {value === "all" ? "全部" : value}
                </button>
              ))}
            </div>
          </div>
        </div>
        <EventGrid events={filteredEvents.slice(0, 18)} />
      </section>

      <section className="profiles-band">
        <div className="section-head">
          <div>
            <span className="section-kicker">Managers</span>
            <h2>已接入的大佬与机构</h2>
          </div>
          <span className="freshness">
            <CalendarDays size={16} />
            最新事件：{formatDate(feed.stats.latestEventDate)}
          </span>
        </div>
        <div className="profile-grid">
          {feed.profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      </section>

      <section className="table-band">
        <div className="section-head">
          <div>
            <span className="section-kicker">Audit Trail</span>
            <h2>披露事件明细</h2>
          </div>
        </div>
        <EventTable events={filteredEvents.slice(0, 60)} />
      </section>

      <section className="sources-band" id="sources">
        <div className="source-layout">
          <div>
            <span className="section-kicker">Data Notes</span>
            <h2>数据边界</h2>
            <p>{feed.site.disclosure}</p>
          </div>
          <div className="note-list">
            {feed.sourceNotes.map((note) => (
              <div className="note-row" key={note}>
                <ShieldCheck size={18} />
                <span>{note}</span>
              </div>
            ))}
            {feed.sourceErrors.length > 0 && (
              <div className="note-row warning">
                <AlertTriangle size={18} />
                <span>{feed.sourceErrors.length} 个来源本次更新失败，页面保留其余可验证数据。</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function TopBar({ generatedAt }: { generatedAt: string }) {
  return (
    <header className="topbar">
      <a className="brand" href="#">
        <Landmark size={22} />
        <span>Guru Holdings Watch</span>
      </a>
      <div className="topbar-meta">
        <RefreshCw size={16} />
        <span>更新于 {formatDate(generatedAt)}</span>
      </div>
    </header>
  );
}

function SignalPanel({
  feed,
  l1Count,
  l2Count
}: {
  feed: HoldingFeed;
  l1Count: number;
  l2Count: number;
}) {
  const bars = [
    { label: "交易日级", value: l1Count, className: "ark" },
    { label: "13F 季度", value: l2Count, className: "sec" },
    {
      label: "减持/清仓",
      value: feed.events.filter((event) => ["decrease", "closed"].includes(event.direction)).length,
      className: "sell"
    }
  ];
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const highlights = feed.events.slice(0, 4);

  return (
    <aside className="signal-panel" aria-label="Disclosure signal panel">
      <div className="signal-top">
        <div>
          <span className="panel-label">Signal Mix</span>
          <strong>{feed.stats.eventCount}</strong>
        </div>
        <span className="status-pill">PUBLIC</span>
      </div>
      <div className="signal-bars">
        {bars.map((bar) => (
          <div className="bar-row" key={bar.label}>
            <span>{bar.label}</span>
            <div className="bar-track">
              <div className={`bar-fill ${bar.className}`} style={{ width: `${(bar.value / max) * 100}%` }} />
            </div>
            <b>{bar.value}</b>
          </div>
        ))}
      </div>
      <div className="mini-feed">
        {highlights.map((event) => (
          <a key={event.id} href={event.evidenceUrl} target="_blank" rel="noreferrer">
            <span className={`dot ${directionClass[event.direction]}`} />
            <span>{event.investorName}</span>
            <b>{event.security.ticker || event.security.name}</b>
          </a>
        ))}
      </div>
    </aside>
  );
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function EventGrid({ events }: { events: HoldingEvent[] }) {
  if (events.length === 0) {
    return <div className="empty-state">没有匹配的披露事件。</div>;
  }

  return (
    <div className="event-grid">
      {events.map((event) => (
        <article className="event-card" key={event.id}>
          <div className="event-card-top">
            <span className={`direction ${directionClass[event.direction]}`}>
              {event.direction === "increase" || event.direction === "new" ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {directionText[event.direction]}
            </span>
            <span className="tier">{event.sourceTier}</span>
          </div>
          <h3>{securityLabel(event)}</h3>
          <p>{event.narrative}</p>
          <div className="event-numbers">
            <div>
              <span>变化市值</span>
              <b>{formatCurrency(event.marketValueDelta)}</b>
            </div>
            <div>
              <span>股数变化</span>
              <b>{formatNumber(event.sharesDelta)}</b>
            </div>
          </div>
          <div className="event-foot">
            <span>{event.staleDisclosure ? "季度披露" : "交易日披露"}</span>
            <a href={event.evidenceUrl} target="_blank" rel="noreferrer" aria-label="查看来源">
              来源
              <ExternalLink size={15} />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const firstHolding = profile.topHoldings?.[0];
  const latestChange = profile.changes?.[0];
  return (
    <article className="profile-card">
      <div className="profile-top">
        <div>
          <h3>{profile.displayName}</h3>
          <p>{profile.vehicleName}</p>
        </div>
        <span className="tier">{profile.sourceTier}</span>
      </div>
      <div className="profile-meta">
        <span>{profile.audience}</span>
        <span>{profile.disclosureType}</span>
      </div>
      <div className="profile-main">
        <div>
          <small>最新报告期</small>
          <strong>{formatDate(profile.latestFiling?.reportDate)}</strong>
        </div>
        <div>
          <small>持仓数量</small>
          <strong>{profile.positionCount ?? profile.topHoldings?.length ?? "未披露"}</strong>
        </div>
      </div>
      <div className="profile-bottom">
        <span>最大持仓：{firstHolding?.ticker || firstHolding?.name || "未披露"}</span>
        <span>最新动作：{latestChange ? directionText[latestChange.direction] : "待更新"}</span>
      </div>
    </article>
  );
}

function EventTable({ events }: { events: HoldingEvent[] }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>人物</th>
            <th>动作</th>
            <th>标的</th>
            <th>报告期</th>
            <th>披露日</th>
            <th>市值变化</th>
            <th>来源</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <strong>{event.investorName}</strong>
                <span>{event.vehicleName}</span>
              </td>
              <td>
                <span className={`direction compact ${directionClass[event.direction]}`}>
                  {directionText[event.direction]}
                </span>
              </td>
              <td>
                <strong>{event.security.ticker || event.security.name}</strong>
                <span>{event.security.cusip || event.security.name}</span>
              </td>
              <td>{formatDate(event.reportDate)}</td>
              <td>{formatDate(event.filingDate)}</td>
              <td>{formatCurrency(event.marketValueDelta)}</td>
              <td>
                <a href={event.evidenceUrl} target="_blank" rel="noreferrer">
                  查看
                  <ExternalLink size={14} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
