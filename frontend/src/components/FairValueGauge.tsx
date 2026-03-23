import { motion } from "motion/react";
import { Target, Calculator } from "lucide-react";
import { formatCurrency, cn } from "../utils";
import { ValuationMethod } from "../types";

interface FairValueGaugeProps {
  current: number;
  low: number;
  mid: number;
  high: number;
  methods: ValuationMethod[];
  dcfValue: number | null;
  peValue: number | null;
  upsidePct: number | null;
  wacc: number | null;
  buyPrice: number | null;
  marginOfSafety: number | null;
}

export const FairValueGauge = ({
  current,
  low,
  mid,
  high,
  methods,
  dcfValue,
  peValue,
  upsidePct,
  wacc,
  buyPrice,
  marginOfSafety,
}: FairValueGaugeProps) => {
  const isValid =
    typeof current === "number" &&
    typeof low === "number" &&
    typeof mid === "number" &&
    typeof high === "number" &&
    high > low;

  // Extend range to show price beyond bounds
  const rangeMin = isValid ? Math.min(low * 0.8, current * 0.9) : 0;
  const rangeMax = isValid ? Math.max(high * 1.2, current * 1.1) : 100;
  const toPercent = (val: number) =>
    isValid
      ? Math.min(
          Math.max(((val - rangeMin) / (rangeMax - rangeMin)) * 100, 0),
          100,
        )
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

      {/* Gauge bar with zone coloring */}
      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
        {/* Green zone: 0 to low */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-500/20"
          style={{ left: "0%", width: `${toPercent(low)}%` }}
        />
        {/* Light green zone: low to mid */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-400/15"
          style={{
            left: `${toPercent(low)}%`,
            width: `${toPercent(mid) - toPercent(low)}%`,
          }}
        />
        {/* Amber zone: mid to high */}
        <div
          className="absolute top-0 bottom-0 bg-amber-400/15"
          style={{
            left: `${toPercent(mid)}%`,
            width: `${toPercent(high) - toPercent(mid)}%`,
          }}
        />
        {/* Red zone: high+ */}
        <div
          className="absolute top-0 bottom-0 bg-rose-500/15"
          style={{ left: `${toPercent(high)}%`, right: "0%" }}
        />

        {/* Price indicator */}
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${toPercent(current)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        />
      </div>

      <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
        <span>Low: {isValid ? formatCurrency(low) : "-"}</span>
        <span>Mid: {isValid ? formatCurrency(mid) : "-"}</span>
        <span>High: {isValid ? formatCurrency(high) : "-"}</span>
      </div>

      {/* Price / Fair Value / Upside grid */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">
            Current
          </p>
          <p className="text-lg font-bold text-white">
            {isValid ? formatCurrency(current) : "-"}
          </p>
        </div>
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">
            Fair Value
          </p>
          <p className="text-lg font-bold text-white">
            {isValid ? formatCurrency(mid) : "-"}
          </p>
        </div>
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">
            Upside
          </p>
          <p
            className={cn(
              "text-lg font-bold",
              upsidePct !== null && upsidePct > 0
                ? "text-emerald-400"
                : "text-rose-400",
            )}
          >
            {upsidePct !== null
              ? `${upsidePct > 0 ? "+" : ""}${upsidePct}%`
              : "-"}
          </p>
        </div>
      </div>

      {/* Valuation methods breakdown */}
      {methods && methods.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-3 flex items-center">
            <Calculator className="w-3 h-3 mr-1" />
            Valuation Models
          </p>
          <div className="space-y-2">
            {methods.map((m, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{m.name}</span>
                  <span className="text-[10px] text-zinc-600">
                    ({m.weight}%)
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-white">
                  {formatCurrency(m.value)}
                </span>
              </div>
            ))}
          </div>
          {/* Individual model values + WACC */}
          {(peValue || dcfValue || wacc) && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 grid grid-cols-3 gap-3">
              {peValue && (
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase">
                    PE Model
                  </p>
                  <p className="text-sm font-mono text-zinc-300">
                    {formatCurrency(peValue)}
                  </p>
                </div>
              )}
              {dcfValue && (
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase">
                    DCF Intrinsic
                  </p>
                  <p className="text-sm font-mono text-zinc-300">
                    {formatCurrency(dcfValue)}
                  </p>
                </div>
              )}
              {wacc !== null && (
                <div>
                  <p className="text-[10px] text-zinc-600 uppercase">
                    WACC (CAPM)
                  </p>
                  <p className="text-sm font-mono text-zinc-300">
                    {wacc.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}
          {/* Margin of Safety buy price */}
          {buyPrice && marginOfSafety !== null && (
            <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Buy Price</span>
                <span className="text-[10px] text-zinc-600">
                  (MoS {marginOfSafety}%)
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-mono font-bold",
                  current <= buyPrice ? "text-emerald-400" : "text-zinc-300",
                )}
              >
                {formatCurrency(buyPrice)}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
