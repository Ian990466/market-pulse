import { StockData } from "../../types";
import { cn, formatCurrency } from "../../utils";

interface WatchlistItemProps {
  stock: StockData;
  isSelected: boolean;
  onSelect: () => void;
}

export function WatchlistItem({ stock, isSelected, onSelect }: WatchlistItemProps) {
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
      <div className="flex flex-col items-start">
        <span className="font-bold text-sm tracking-wide">{stock.ticker}</span>
        <span
          className={cn(
            "text-[10px] truncate max-w-[140px]",
            isSelected ? "text-zinc-900/70" : "text-zinc-500",
          )}
        >
          {stock.name}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-mono">{formatCurrency(stock.price)}</span>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded",
            isSelected
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
  );
}
