import { motion } from "motion/react";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { StockData } from "../types";
import { formatCompactNumber, cn } from "../utils";

interface StockHeaderProps {
  stock: StockData;
  selectedDate: string;
}

const ZONE_STYLES: Record<string, string> = {
  "Strong Buy": "bg-emerald-500 text-zinc-950",
  "Fair Buy": "bg-emerald-400/80 text-zinc-950",
  "Hold/Watch": "bg-amber-400 text-zinc-950",
  "Overvalued": "bg-rose-500 text-white",
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-400 border-emerald-400",
  A: "text-emerald-400 border-emerald-400",
  "A-": "text-emerald-400 border-emerald-400",
  "B+": "text-sky-400 border-sky-400",
  B: "text-sky-400 border-sky-400",
  "B-": "text-sky-400 border-sky-400",
  "C+": "text-amber-400 border-amber-400",
  C: "text-amber-400 border-amber-400",
  "C-": "text-amber-400 border-amber-400",
  D: "text-rose-400 border-rose-400",
};

export function StockHeader({ stock, selectedDate }: StockHeaderProps) {
  const gradeColor = GRADE_COLORS[stock.grade] || "text-zinc-400 border-zinc-400";
  const zoneStyle = ZONE_STYLES[stock.zone] || "bg-zinc-700 text-zinc-300";
  const hasRisks = stock.risk_flags && stock.risk_flags.length > 0;

  return (
    <motion.header
      key={`${stock.ticker}-${selectedDate}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-10"
    >
      {/* Top row: ticker, name, grade, market cap */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl font-black tracking-tighter text-white">
            {stock.ticker}
          </span>
          <div className="h-8 w-[1px] bg-zinc-800" />
          <span className="text-xl text-zinc-500 font-medium">{stock.name}</span>
          <div
            className={cn(
              "px-3 py-1 border-2 rounded-lg text-sm font-black",
              gradeColor,
            )}
          >
            {stock.grade}
          </div>
          <span className="text-[10px] text-zinc-600 font-mono">
            ({stock.grade_score}pts)
          </span>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Market Cap
          </p>
          <p className="text-3xl font-black text-white">
            ${formatCompactNumber(stock.market_cap * 1e9)}
          </p>
        </div>
      </div>

      {/* Second row: zone, upside, signal, risks */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", zoneStyle)}>
          {stock.zone}
        </span>

        {stock.upside_pct !== null && stock.upside_pct !== undefined && (
          <span
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
              stock.upside_pct > 0
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400",
            )}
          >
            {stock.upside_pct > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {stock.upside_pct > 0 ? "+" : ""}
            {stock.upside_pct}% to fair value
          </span>
        )}

        <span className="text-zinc-700">|</span>

        <span className="text-zinc-400 text-sm flex items-center">
          <Activity className="w-4 h-4 mr-1 text-emerald-500" />
          {stock.signal}
        </span>

        {hasRisks && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="text-amber-400 text-sm flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {stock.risk_flags.length} risk{stock.risk_flags.length > 1 ? "s" : ""}
            </span>
          </>
        )}

        {stock.sector && (
          <>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500 text-xs flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              {stock.sector.replace("_", " ")}
            </span>
          </>
        )}
      </div>

      {/* Risk flags expandable */}
      {hasRisks && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 flex flex-wrap gap-2"
        >
          {stock.risk_flags.map((flag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-400"
            >
              <AlertTriangle className="w-3 h-3" />
              {flag}
            </span>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
