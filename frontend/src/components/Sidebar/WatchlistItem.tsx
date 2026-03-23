import { StockData } from "../../types";
import { cn, formatCurrency } from "../../utils";

interface WatchlistItemProps {
  stock: StockData;
  isSelected: boolean;
  onSelect: () => void;
}

const ZONE_DOT: Record<string, string> = {
  "Strong Buy": "bg-emerald-500",
  "Fair Buy": "bg-emerald-400",
  "Hold/Watch": "bg-amber-400",
  "Overvalued": "bg-rose-500",
};

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  "A+": { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  A:    { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  "A-": { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  "B+": { bg: "bg-sky-500/10",     text: "text-sky-400" },
  B:    { bg: "bg-sky-500/10",     text: "text-sky-400" },
  "B-": { bg: "bg-sky-500/10",     text: "text-sky-400" },
  "C+": { bg: "bg-amber-500/10",   text: "text-amber-400" },
  C:    { bg: "bg-amber-500/10",   text: "text-amber-400" },
  "C-": { bg: "bg-amber-500/10",   text: "text-amber-400" },
  D:    { bg: "bg-rose-500/10",    text: "text-rose-400" },
};

export function WatchlistItem({ stock, isSelected, onSelect }: WatchlistItemProps) {
  const zoneDot = ZONE_DOT[stock.zone] || "bg-zinc-600";
  const gradeStyle = GRADE_COLORS[stock.grade] || { bg: "bg-zinc-800", text: "text-zinc-400" };

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
        isSelected
          ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10"
          : "hover:bg-zinc-800 text-zinc-400",
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Zone indicator dot */}
        <div
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isSelected ? "bg-zinc-950/40" : zoneDot,
          )}
        />
        <div className="flex flex-col items-start">
          <span className="font-bold text-sm tracking-wide">{stock.ticker}</span>
          <span
            className={cn(
              "text-[10px] truncate max-w-[120px]",
              isSelected ? "text-zinc-900/70" : "text-zinc-500",
            )}
          >
            {stock.name}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs font-mono">{formatCurrency(stock.price)}</span>
        <div className="flex items-center gap-1.5">
          {/* Upside badge */}
          {stock.upside_pct !== null && stock.upside_pct !== undefined && (
            <span
              className={cn(
                "text-[9px] font-mono font-bold",
                isSelected
                  ? "text-zinc-950/60"
                  : stock.upside_pct > 0
                    ? "text-emerald-500"
                    : "text-rose-400",
              )}
            >
              {stock.upside_pct > 0 ? "+" : ""}{stock.upside_pct}%
            </span>
          )}
          {/* Grade badge */}
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded",
              isSelected
                ? "bg-zinc-950/20 text-zinc-950"
                : `${gradeStyle.bg} ${gradeStyle.text}`,
            )}
          >
            {stock.grade}
          </span>
        </div>
      </div>
    </button>
  );
}
