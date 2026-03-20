import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Info,
  RefreshCw,
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { motion } from "motion/react";
import { ReportData } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ReportsModule = () => {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/reports/tickers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTickers(data);
      })
      .catch((err) => console.error("Error fetching tickers:", err));
  }, []);

  useEffect(() => {
    if (selectedTicker) {
      fetch(`/api/reports/${selectedTicker}/dates`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setDates(data.sort().reverse());
            if (data.length > 0) setSelectedDate(data[0]);
          }
        })
        .catch((err) => console.error("Error fetching dates:", err));
    } else {
      setDates([]);
      setSelectedDate(null);
    }
  }, [selectedTicker]);

  useEffect(() => {
    if (selectedTicker && selectedDate) {
      setIsLoading(true);
      fetch(`/api/reports/${selectedTicker}/${selectedDate}`)
        .then((res) => res.json())
        .then((data) => {
          setReportData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching report:", err);
          setIsLoading(false);
        });
    } else {
      setReportData(null);
    }
  }, [selectedTicker, selectedDate]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Analysis Reports
          </h2>
          <p className="text-zinc-500 mt-1">
            Browse historical AI analysis reports by ticker and date.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" /> Select Ticker
            </h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {tickers.length > 0 ? (
                tickers.map((ticker) => (
                  <button
                    key={ticker}
                    onClick={() => setSelectedTicker(ticker)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      selectedTicker === ticker
                        ? "bg-emerald-500 text-zinc-950"
                        : "text-zinc-400 hover:bg-zinc-800",
                    )}
                  >
                    {ticker}
                  </button>
                ))
              ) : (
                <p className="text-xs text-zinc-600 italic">
                  No reports found in /reports directory.
                </p>
              )}
            </div>
          </div>

          {selectedTicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl"
            >
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Available Dates
              </h3>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {dates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm font-mono transition-all",
                      selectedDate === date
                        ? "bg-emerald-500 text-zinc-950"
                        : "text-zinc-400 hover:bg-zinc-800",
                    )}
                  >
                    {date}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] bg-zinc-900 rounded-2xl border border-zinc-800">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : reportData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-xl">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl font-black text-white">
                        {reportData.ticker}
                      </span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-xl font-mono text-emerald-500">
                        {reportData.date}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                        reportData.analysis?.sentiment === "Bullish"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : reportData.analysis?.sentiment === "Bearish"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-zinc-800 text-zinc-400",
                      )}
                    >
                      {reportData.analysis?.sentiment === "Bullish" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : reportData.analysis?.sentiment === "Bearish" ? (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      ) : null}
                      {reportData.analysis?.sentiment || "Neutral"} • Score:{" "}
                      {reportData.analysis?.score || 0}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                      Risk Level
                    </p>
                    <p
                      className={cn(
                        "text-xl font-black",
                        reportData.analysis?.metrics?.risk_level === "Low"
                          ? "text-emerald-500"
                          : reportData.analysis?.metrics?.risk_level === "High"
                            ? "text-rose-500"
                            : "text-amber-500",
                      )}
                    >
                      {reportData.analysis?.metrics?.risk_level || "Medium"}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-zinc-950 rounded-xl border border-zinc-800 mb-8">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Executive Summary
                  </h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {reportData.analysis?.summary ||
                      "No summary available for this report."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">
                      P/E Ratio
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {reportData.analysis?.metrics?.pe_ratio || "N/A"}
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">
                      Growth Rate
                    </p>
                    <p className="text-2xl font-mono font-bold text-emerald-500">
                      +{reportData.analysis?.metrics?.growth_rate || 0}%
                    </p>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest mb-1">
                      Sentiment Score
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            reportData.analysis?.score > 70
                              ? "bg-emerald-500"
                              : reportData.analysis?.score < 40
                                ? "bg-rose-500"
                                : "bg-amber-500",
                          )}
                          style={{
                            width: `${reportData.analysis?.score || 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white">
                        {reportData.analysis?.score || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {reportData.analysis?.chart_data && (
                  <div className="h-[350px] w-full mt-8 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Intraday Performance
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.analysis.chart_data}>
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
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{
                            r: 6,
                            fill: "#10b981",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-600 border-dashed">
              <FileText className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">
                Select a ticker and date to view report
              </p>
              <p className="text-sm opacity-60">
                Historical analysis data will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
