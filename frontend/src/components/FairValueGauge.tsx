import { motion } from "motion/react";
import { Target } from "lucide-react";
import { formatCurrency, cn } from "../utils";

export const FairValueGauge = ({
  current,
  low,
  mid,
  high,
}: {
  current: number;
  low: number;
  mid: number;
  high: number;
}) => {
  const isValid =
    typeof current === "number" &&
    typeof low === "number" &&
    typeof mid === "number" &&
    typeof high === "number" &&
    high > low;
  const percentage = isValid
    ? Math.min(Math.max(((current - low) / (high - low)) * 100, 0), 100)
    : 0;

  let zoneColor = "bg-zinc-700";
  let zoneLabel = "Unknown";

  if (!isValid) {
    zoneLabel = "No Data";
  } else if (current <= low) {
    zoneColor = "bg-emerald-500";
    zoneLabel = "Strong Buy";
  } else if (current <= mid) {
    zoneColor = "bg-emerald-400";
    zoneLabel = "Fair Buy";
  } else if (current <= high) {
    zoneColor = "bg-amber-400";
    zoneLabel = "Hold";
  } else {
    zoneColor = "bg-rose-500";
    zoneLabel = "Overvalued";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Target className="w-5 h-5 mr-2 text-emerald-500" />
          Fair Value Analysis
        </h3>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-bold text-zinc-950 uppercase tracking-wider",
            zoneColor,
          )}
        >
          {zoneLabel}
        </span>
      </div>

      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 opacity-20 w-full" />
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
        <span>Low: {isValid ? formatCurrency(low) : "-"}</span>
        <span>Mid: {isValid ? formatCurrency(mid) : "-"}</span>
        <span>High: {isValid ? formatCurrency(high) : "-"}</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">
            Current Price
          </p>
          <p className="text-xl font-bold text-white">
            {isValid ? formatCurrency(current) : "-"}
          </p>
        </div>
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">
            Fair Value (Mid)
          </p>
          <p className="text-xl font-bold text-white">
            {isValid ? formatCurrency(mid) : "-"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
