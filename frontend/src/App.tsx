import { useState, useMemo, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Search,
  RefreshCw,
  FileText,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StockData } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Components
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MetricCard } from "./components/MetricCard";
import { ComparisonModal } from "./components/ComparisonModal";
import { FairValueGauge } from "./components/FairValueGauge";

// Utils
import { formatCurrency, formatCompactNumber } from "./utils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function createStub(ticker: string): StockData {
  return {
    ticker,
    name: ticker,
    price: 0,
    market_cap: 0,
    ttm_pe: null,
    forward_pe: null,
    peg: null,
    ps_ratio: null,
    ev_ebitda: null,
    gross_margin: null,
    op_margin: null,
    net_margin: null,
    roe: null,
    roic: null,
    rev_growth_yoy: null,
    eps_growth_yoy: null,
    beta: null,
    debt_equity: null,
    current_ratio: null,
    high_52w: 0,
    low_52w: 0,
    fcf_per_share: null,
    fcf_yield: null,
    quarterly_revenue: [],
    quarterly_eps: [],
    my_fair_low: 0,
    my_fair_mid: 0,
    my_fair_high: 0,
    grade: "-",
    signal: "-",
    zone: "-",
  };
}

function AppContent() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [comparisonMetric, setComparisonMetric] = useState<
    "pe" | "margin" | "growth" | null
  >(null);

  // Reports integration
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const reportData = null;
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const selectedStock = useMemo(
    () => stocks.find((s) => s.ticker === selectedTicker) || stocks[0],
    [selectedTicker, stocks],
  );

  // Fetch all latest reports on mount to populate watchlist with real data
  useEffect(() => {
    fetch("/api/reports/latest")
      .then((res) => res.json())
      .then((data: StockData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setStocks(data);
          setSelectedTicker(data[0].ticker);
        }
      })
      .catch((err) => console.error("Error fetching latest reports:", err));
  }, []);

  // Fetch dates when ticker changes, always default to latest available date
  useEffect(() => {
    if (!selectedTicker) return;
    fetch(`/api/reports/${selectedTicker}/dates`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = data.sort().reverse();
          setAvailableDates(sorted);
          setSelectedDate(sorted[0]);
          const latestDate = sorted[0];
          const year = parseInt(latestDate.slice(0, 4));
          const month = parseInt(latestDate.slice(4, 6)) - 1;
          const day = parseInt(latestDate.slice(6, 8));
          setViewDate(new Date(year, month, day));
        } else {
          setAvailableDates([]);
          setSelectedDate("");
        }
      })
      .catch(() => {
        setAvailableDates([]);
        setSelectedDate("");
      });
  }, [selectedTicker]);

  // Fetch report data and update stock when date changes
  useEffect(() => {
    if (!selectedTicker || !selectedDate) return;
    setIsReportLoading(true);
    fetch(`/api/reports/${selectedTicker}/${selectedDate}`)
      .then((res) => {
        if (!res.ok) throw new Error("No report");
        return res.json();
      })
      .then((data: StockData) => {
        setStocks((prev) =>
          prev.map((s) =>
            s.ticker === selectedTicker ? { ...s, ...data } : s,
          ),
        );
        setIsReportLoading(false);
      })
      .catch(() => {
        setIsReportLoading(false);
      });
  }, [selectedTicker, selectedDate]);

  const formatDateString = (dateStr: string) => {
    if (dateStr === "Live") return "Live Data";
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  const filteredStocks = useMemo(
    () =>
      stocks.filter(
        (s) =>
          s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, stocks],
  );

  const chartData = useMemo(() => {
    if (!selectedStock || !Array.isArray(selectedStock.quarterly_revenue))
      return [];
    return [...selectedStock.quarterly_revenue]
      .filter((q) => q && typeof q.revenue === "number" && !isNaN(q.revenue))
      .reverse()
      .map((q) => ({
        date: q.date || "N/A",
        revenue: q.revenue || 0,
        netIncome: q.netIncome || 0,
        margin: q.grossMargin || 0,
      }));
  }, [selectedStock]);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <LayoutDashboard className="text-zinc-950 w-6 h-6" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">
              StockScope
            </h1>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search ticker..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            View Mode
          </div>
          <div className="px-3 mb-6 space-y-3 relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-left flex items-center justify-between group relative"
            >
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
              <span>{formatDateString(selectedDate)}</span>
              <ChevronRight
                className={cn(
                  "w-3 h-3 text-zinc-600 transition-transform",
                  isCalendarOpen && "rotate-90",
                )}
              />
            </button>

            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 p-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={viewDate.getMonth()}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs font-bold text-zinc-200 uppercase tracking-widest"
                      >
                        {viewDate.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </motion.span>
                    </AnimatePresence>
                    <button
                      onClick={() =>
                        setViewDate(
                          new Date(
                            viewDate.getFullYear(),
                            viewDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-4 min-h-[180px]">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                      <div
                        key={day}
                        className="text-[10px] font-bold text-zinc-600 text-center py-1"
                      >
                        {day}
                      </div>
                    ))}
                    {(() => {
                      const daysInMonth = new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth() + 1,
                        0,
                      ).getDate();
                      const firstDayOfMonth = new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth(),
                        1,
                      ).getDay();
                      const days = [];

                      for (let i = 0; i < firstDayOfMonth; i++) {
                        days.push(<div key={`empty-${i}`} />);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateObj = new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth(),
                          d,
                        );
                        const dateKey = dateObj
                          .toISOString()
                          .split("T")[0]
                          .replace(/-/g, "");
                        const hasReport = availableDates.includes(dateKey);
                        const isSelected = selectedDate === dateKey;
                        const isToday =
                          new Date()
                            .toISOString()
                            .split("T")[0]
                            .replace(/-/g, "") === dateKey;

                        days.push(
                          <button
                            key={d}
                            disabled={!hasReport}
                            onClick={() => {
                              setSelectedDate(dateKey);
                              setIsCalendarOpen(false);
                            }}
                            className={cn(
                              "text-xs py-1.5 rounded-lg transition-all relative flex items-center justify-center",
                              hasReport
                                ? "text-zinc-200 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer"
                                : "text-zinc-700 cursor-not-allowed",
                              isSelected &&
                                "bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-500 hover:text-zinc-950",
                              isToday &&
                                !isSelected &&
                                "border border-emerald-500/30",
                            )}
                          >
                            {d}
                            {hasReport && !isSelected && (
                              <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
                            )}
                          </button>,
                        );
                      }

                      // Fill remaining cells to always show 6 rows (42 cells total)
                      const totalCells = 42;
                      const currentCells = days.length;
                      for (let i = 0; i < totalCells - currentCells; i++) {
                        days.push(<div key={`empty-end-${i}`} />);
                      }

                      return days;
                    })()}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDate("Live");
                      setIsCalendarOpen(false);
                    }}
                    className={cn(
                      "w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      selectedDate === "Live"
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
                    )}
                  >
                    Live Data (Current)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Status
              </span>
              {selectedDate && selectedDate !== "Live" ? (
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Report Found
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  Live Data
                </span>
              )}
            </div>
          </div>

          <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            Watchlist
          </div>
          {filteredStocks.map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => setSelectedTicker(stock.ticker)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                selectedTicker === stock.ticker
                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10"
                  : "hover:bg-zinc-800 text-zinc-400",
              )}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm tracking-wide">
                  {stock.ticker}
                </span>
                <span
                  className={cn(
                    "text-[10px] truncate max-w-[140px]",
                    selectedTicker === stock.ticker
                      ? "text-zinc-900/70"
                      : "text-zinc-500",
                  )}
                >
                  {stock.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono">
                  {formatCurrency(stock.price)}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    selectedTicker === stock.ticker
                      ? "bg-zinc-950/20 text-zinc-950"
                      : stock.grade && stock.grade.startsWith("A")
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {stock.grade}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-950 custom-scrollbar relative">
        {isReportLoading && (
          <div className="absolute inset-0 z-10 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}
        {selectedStock ? (
          <div className="max-w-7xl mx-auto">
            <motion.header
              key={`${selectedStock.ticker}-${selectedDate}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between items-end mb-10"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-black tracking-tighter text-white">
                    {selectedStock.ticker}
                  </span>
                  <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
                  <span className="text-xl text-zinc-500 font-medium">
                    {selectedStock.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400 text-sm flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-emerald-500" />
                    {reportData
                      ? reportData.analysis.sentiment + " (Report)"
                      : selectedStock.signal}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-400 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                    {reportData
                      ? `Score: ${reportData.analysis.score}`
                      : `Zone: ${selectedStock.zone}`}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  {reportData ? "Report Date" : "Market Cap"}
                </p>
                <p className="text-3xl font-black text-white">
                  {reportData
                    ? selectedDate
                    : `$${formatCompactNumber(selectedStock.market_cap * 1e9)}`}
                </p>
              </div>
            </motion.header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Price"
                value={
                  !reportData
                    ? formatCurrency(selectedStock.price)
                    : formatCurrency(
                        reportData.analysis.chart_data[
                          reportData.analysis.chart_data.length - 1
                        ]?.value || 0,
                      )
                }
                subValue={
                  !reportData
                    ? `52W Range: ${formatCurrency(selectedStock.low_52w)} - ${formatCurrency(selectedStock.high_52w)}`
                    : "Closing Price in Report"
                }
                icon={DollarSign}
                trend={
                  !reportData
                    ? selectedStock.price > selectedStock.my_fair_mid
                      ? "down"
                      : "up"
                    : reportData.analysis.sentiment === "Bullish"
                      ? "up"
                      : reportData.analysis.sentiment === "Bearish"
                        ? "down"
                        : "neutral"
                }
              />
              <MetricCard
                title="P/E Ratio"
                value={
                  !reportData
                    ? typeof selectedStock.ttm_pe === "number"
                      ? selectedStock.ttm_pe.toFixed(2)
                      : "N/A"
                    : reportData.analysis.metrics.pe_ratio?.toFixed(2) || "N/A"
                }
                subValue={
                  !reportData
                    ? `Forward: ${typeof selectedStock.forward_pe === "number" ? selectedStock.forward_pe.toFixed(2) : "N/A"}`
                    : "Reported P/E"
                }
                icon={BarChart3}
                onClick={() => setComparisonMetric("pe")}
              />
              <MetricCard
                title="Gross Margin"
                value={`${(selectedStock.gross_margin || 0).toFixed(1)}%`}
                subValue={`Op Margin: ${(selectedStock.op_margin || 0).toFixed(1)}%`}
                icon={Activity}
                onClick={() => setComparisonMetric("margin")}
              />
              <MetricCard
                title="Rev Growth (YoY)"
                value={
                  typeof selectedStock.rev_growth_yoy === "number"
                    ? `${selectedStock.rev_growth_yoy.toFixed(1)}%`
                    : "N/A"
                }
                subValue={`EPS Growth: ${typeof selectedStock.eps_growth_yoy === "number" ? selectedStock.eps_growth_yoy.toFixed(1) + "%" : "N/A"}`}
                icon={TrendingUp}
                trend={
                  selectedStock.rev_growth_yoy &&
                  selectedStock.rev_growth_yoy > 15
                    ? "up"
                    : "neutral"
                }
                onClick={() => setComparisonMetric("growth")}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Charts */}
              <div className="lg:col-span-2 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-white">
                    {!reportData
                      ? "Financial Performance (Quarterly)"
                      : "Intraday Performance (Report)"}
                  </h3>
                  <div className="flex gap-4">
                    {!reportData ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-zinc-100" />
                          <span className="text-xs text-zinc-500 font-medium">
                            Revenue
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-xs text-zinc-500 font-medium">
                            Net Income
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-zinc-500 font-medium">
                          Price
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {!reportData ? (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="colorRev"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ffffff"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ffffff"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorInc"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#27272a"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#71717a" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#71717a" }}
                          tickFormatter={(val) =>
                            `$${formatCompactNumber(val)}`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderRadius: "12px",
                            border: "1px solid #27272a",
                            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
                          }}
                          itemStyle={{ color: "#fff" }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#ffffff"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                        />
                        <Area
                          type="monotone"
                          dataKey="netIncome"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorInc)"
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={reportData?.analysis.chart_data || []}>
                        <defs>
                          <linearGradient
                            id="colorValue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#27272a"
                        />
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#71717a" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#71717a" }}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#18181b",
                            borderRadius: "12px",
                            border: "1px solid #27272a",
                          }}
                          itemStyle={{ color: "#10b981" }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Price",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fair Value & AI Insights */}
              <div className="space-y-8">
                <FairValueGauge
                  current={
                    !reportData
                      ? selectedStock.price
                      : reportData.analysis.chart_data?.[
                          reportData.analysis.chart_data.length - 1
                        ]?.value || 0
                  }
                  low={selectedStock.my_fair_low}
                  mid={selectedStock.my_fair_mid}
                  high={selectedStock.my_fair_high}
                />

                {!reportData ? (
                  <div className="bg-zinc-900 text-white p-8 rounded-2xl border border-zinc-800 shadow-xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                      Efficiency Metrics
                    </h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">
                          Return on Equity (ROE)
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {typeof selectedStock.roe === "number"
                            ? selectedStock.roe.toFixed(2)
                            : "-"}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">FCF Yield</span>
                        <span className="font-mono font-bold text-white">
                          {typeof selectedStock.fcf_yield === "number"
                            ? selectedStock.fcf_yield.toFixed(2)
                            : "-"}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">
                          Current Ratio
                        </span>
                        <span className="font-mono font-bold text-white">
                          {selectedStock.current_ratio?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">
                          Debt to Equity
                        </span>
                        <span className="font-mono font-bold text-white">
                          {selectedStock.debt_equity?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <div className="pt-4 border-t border-zinc-800">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 text-sm">
                            Beta (Volatility)
                          </span>
                          <span className="font-mono font-bold text-white">
                            {selectedStock.beta?.toFixed(2) || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 text-white p-8 rounded-2xl border border-zinc-800 shadow-xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-emerald-500" />
                      Report Details
                    </h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">Sentiment</span>
                        <span
                          className={cn(
                            "font-bold",
                            reportData?.analysis.sentiment === "Bullish"
                              ? "text-emerald-500"
                              : reportData?.analysis.sentiment === "Bearish"
                                ? "text-rose-500"
                                : "text-amber-500",
                          )}
                        >
                          {reportData?.analysis.sentiment}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">Score</span>
                        <span className="font-mono font-bold text-white">
                          {reportData?.analysis.score}/100
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">
                          Risk Level
                        </span>
                        <span
                          className={cn(
                            "font-bold",
                            reportData?.analysis.metrics.risk_level === "Low"
                              ? "text-emerald-500"
                              : reportData?.analysis.metrics.risk_level ===
                                  "High"
                                ? "text-rose-500"
                                : "text-amber-500",
                          )}
                        >
                          {reportData?.analysis.metrics.risk_level}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">
                          Growth Rate
                        </span>
                        <span className="font-mono font-bold text-white">
                          {reportData?.analysis.metrics.growth_rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quarterly Table (Only for Live Data) */}
            {!reportData && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden mb-12">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">
                    Quarterly Breakdown
                  </h3>
                  <button className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center">
                    Export CSV <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-950/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Date
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Revenue
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Op Income
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Net Income
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          EPS
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Gross Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {selectedStock.quarterly_revenue.map((q, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-zinc-800/50 transition-colors group"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-white">
                            {q.date}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                            {typeof q.revenue === "number"
                              ? formatCurrency(q.revenue)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                            {typeof q.operatingIncome === "number"
                              ? formatCurrency(q.operatingIncome)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                            {typeof q.netIncome === "number"
                              ? formatCurrency(q.netIncome)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                            {typeof q.eps === "number" ? q.eps.toFixed(2) : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${q.grossMargin || 0}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-white">
                                {typeof q.grossMargin === "number"
                                  ? q.grossMargin.toFixed(1)
                                  : "0.0"}
                                %
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mt-12 mb-12">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> AI Analysis Summary
              </h3>
              <div className="h-24 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-600 text-sm italic">
                  AI analysis summary will be displayed here.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No stocks found.</p>
          </div>
        )}
      </main>

      <ComparisonModal
        isOpen={!!comparisonMetric}
        onClose={() => setComparisonMetric(null)}
        metric={comparisonMetric}
        stocks={stocks}
      />
    </div>
  );
}
