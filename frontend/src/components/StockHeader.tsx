import { motion } from "motion/react";
import { Activity, AlertCircle } from "lucide-react";
import { StockData } from "../types";
import { formatCompactNumber } from "../utils";

interface StockHeaderProps {
  stock: StockData;
  selectedDate: string;
}

export function StockHeader({ stock, selectedDate }: StockHeaderProps) {
  return (
    <motion.header
      key={`${stock.ticker}-${selectedDate}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-between items-end mb-10"
    >
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl font-black tracking-tighter text-white">
            {stock.ticker}
          </span>
          <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
          <span className="text-xl text-zinc-500 font-medium">{stock.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm flex items-center">
            <Activity className="w-4 h-4 mr-1 text-emerald-500" />
            {stock.signal}
          </span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
            Zone: {stock.zone}
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
          Market Cap
        </p>
        <p className="text-3xl font-black text-white">
          ${formatCompactNumber(stock.market_cap * 1e9)}
        </p>
      </div>
    </motion.header>
  );
}
