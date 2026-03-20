import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, 
  Target, AlertCircle, ChevronRight, LayoutDashboard, Search,
  Info, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { STOCKS_DATA } from './data';
import { StockData, QuarterlyData } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatCompactNumber = (number: number) => {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
};

const MetricCard = ({ title, value, subValue, icon: Icon, trend, onClick }: { 
  title: string, value: string, subValue?: string, icon: any, trend?: 'up' | 'down' | 'neutral', onClick?: () => void
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={cn(
      "bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all",
      onClick && "cursor-pointer hover:bg-zinc-800/80 active:scale-[0.98]"
    )}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
        <Icon className="w-5 h-5 text-emerald-500" />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center text-xs font-medium px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : 
          trend === 'down' ? "bg-rose-500/10 text-rose-500" : "bg-zinc-800 text-zinc-400"
        )}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : 
           trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
          {trend === 'up' ? 'Bullish' : trend === 'down' ? 'Bearish' : 'Neutral'}
        </div>
      )}
      {onClick && (
        <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center">
          Compare <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
      {subValue && <p className="text-sm text-zinc-500 mt-1">{subValue}</p>}
    </div>
  </motion.div>
);

const ComparisonModal = ({ 
  isOpen, 
  onClose, 
  metric, 
  stocks 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  metric: 'pe' | 'margin' | 'growth' | null,
  stocks: StockData[]
}) => {
  const data = useMemo(() => {
    if (!metric) return [];
    return stocks.map(s => ({
      ticker: s.ticker,
      value: metric === 'pe' ? s.ttm_pe : metric === 'margin' ? s.gross_margin : s.rev_growth_yoy,
      name: s.name
    })).sort((a, b) => (b.value || 0) - (a.value || 0));
  }, [metric, stocks]);

  const title = metric === 'pe' ? 'P/E Ratio Comparison' : 
                metric === 'margin' ? 'Gross Margin Comparison (%)' : 
                metric === 'growth' ? 'Revenue Growth Comparison (%)' : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <RefreshCw className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="ticker" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(value: number) => [value?.toFixed(2), metric?.toUpperCase()]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]} 
                    barSize={24}
                    label={{ position: 'right', fill: '#71717a', fontSize: 10, offset: 10 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FairValueGauge = ({ current, low, mid, high }: { current: number, low: number, mid: number, high: number }) => {
  const percentage = Math.min(Math.max(((current - low) / (high - low)) * 100, 0), 100);
  
  let zoneColor = "bg-zinc-700";
  let zoneLabel = "Unknown";

  if (current <= low) { zoneColor = "bg-emerald-500"; zoneLabel = "Strong Buy"; }
  else if (current <= mid) { zoneColor = "bg-emerald-400"; zoneLabel = "Fair Buy"; }
  else if (current <= high) { zoneColor = "bg-amber-400"; zoneLabel = "Hold"; }
  else { zoneColor = "bg-rose-500"; zoneLabel = "Overvalued"; }

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
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold text-zinc-950 uppercase tracking-wider", zoneColor)}>
          {zoneLabel}
        </span>
      </div>
      
      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div 
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 opacity-20 w-full"
        />
        <motion.div 
          initial={{ left: 0 }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 bottom-0 w-1 bg-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        />
      </div>
      
      <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
        <span>Low: {formatCurrency(low)}</span>
        <span>Mid: {formatCurrency(mid)}</span>
        <span>High: {formatCurrency(high)}</span>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">Current Price</p>
          <p className="text-xl font-bold text-white">{formatCurrency(current)}</p>
        </div>
        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
          <p className="text-[10px] text-zinc-600 uppercase font-bold">Fair Value (Mid)</p>
          <p className="text-xl font-bold text-white">{formatCurrency(mid)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [stocks, setStocks] = useState(STOCKS_DATA);
  const [selectedTicker, setSelectedTicker] = useState(stocks[0]?.ticker || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [comparisonMetric, setComparisonMetric] = useState<'pe' | 'margin' | 'growth' | null>(null);

  const selectedStock = useMemo(() => 
    stocks.find(s => s.ticker === selectedTicker) || stocks[0],
    [selectedTicker, stocks]
  );

  const filteredStocks = useMemo(() => 
    stocks.filter(s => 
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery, stocks]
  );

  const handleImport = () => {
    try {
      const newData = JSON.parse(importText);
      if (Array.isArray(newData)) {
        setStocks(newData);
        if (newData.length > 0) setSelectedTicker(newData[0].ticker);
        setIsImportOpen(false);
        setImportText('');
      } else {
        alert("Invalid format. Please provide an array of stock data.");
      }
    } catch (e) {
      alert("Invalid JSON format.");
    }
  };

  const chartData = useMemo(() => {
    if (!selectedStock) return [];
    return [...selectedStock.quarterly_revenue]
      .filter(q => !isNaN(q.revenue))
      .reverse()
      .map(q => ({
        date: q.date,
        revenue: q.revenue,
        netIncome: q.netIncome,
        margin: q.grossMargin
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
            <h1 className="font-bold text-xl tracking-tight text-white">StockScope</h1>
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

          <button 
            onClick={() => setIsImportOpen(true)}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Import JSON Data
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredStocks.map(stock => (
            <button
              key={stock.ticker}
              onClick={() => setSelectedTicker(stock.ticker)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                selectedTicker === stock.ticker 
                  ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10" 
                  : "hover:bg-zinc-800 text-zinc-400"
              )}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm tracking-wide">{stock.ticker}</span>
                <span className={cn(
                  "text-[10px] truncate max-w-[140px]",
                  selectedTicker === stock.ticker ? "text-zinc-900/70" : "text-zinc-500"
                )}>
                  {stock.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono">{formatCurrency(stock.price)}</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  selectedTicker === stock.ticker 
                    ? "bg-zinc-950/20 text-zinc-950" 
                    : stock.grade.startsWith('A') ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                )}>
                  {stock.grade}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-950">
        {selectedStock ? (
          <>
            <motion.header 
              key={selectedStock.ticker}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-between items-end mb-10"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl font-black tracking-tighter text-white">{selectedStock.ticker}</span>
                  <div className="h-8 w-[1px] bg-zinc-800 mx-2" />
                  <span className="text-xl text-zinc-500 font-medium">{selectedStock.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-400 text-sm flex items-center">
                    <Activity className="w-4 h-4 mr-1 text-emerald-500" />
                    {selectedStock.signal}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-400 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 text-amber-500" />
                    Zone: {selectedStock.zone}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Market Cap</p>
                <p className="text-3xl font-black text-white">${formatCompactNumber(selectedStock.market_cap * 1e9)}</p>
              </div>
            </motion.header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard 
                title="Price" 
                value={formatCurrency(selectedStock.price)} 
                subValue={`52W Range: ${formatCurrency(selectedStock.low_52w)} - ${formatCurrency(selectedStock.high_52w)}`}
                icon={DollarSign}
                trend={selectedStock.price > selectedStock.my_fair_mid ? 'down' : 'up'}
              />
              <MetricCard 
                title="TTM P/E" 
                value={selectedStock.ttm_pe?.toFixed(2) || 'N/A'} 
                subValue={`Forward: ${selectedStock.forward_pe?.toFixed(2) || 'N/A'}`}
                icon={BarChart3}
                onClick={() => setComparisonMetric('pe')}
              />
              <MetricCard 
                title="Gross Margin" 
                value={`${selectedStock.gross_margin.toFixed(1)}%`} 
                subValue={`Op Margin: ${selectedStock.op_margin.toFixed(1)}%`}
                icon={Activity}
                onClick={() => setComparisonMetric('margin')}
              />
              <MetricCard 
                title="Rev Growth (YoY)" 
                value={`${selectedStock.rev_growth_yoy?.toFixed(1)}%`} 
                subValue={`EPS Growth: ${selectedStock.eps_growth_yoy?.toFixed(1)}%`}
                icon={TrendingUp}
                trend={selectedStock.rev_growth_yoy && selectedStock.rev_growth_yoy > 15 ? 'up' : 'neutral'}
                onClick={() => setComparisonMetric('growth')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Charts */}
              <div className="lg:col-span-2 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-white">Financial Performance (Quarterly)</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-zinc-100" />
                      <span className="text-xs text-zinc-500 font-medium">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs text-zinc-500 font-medium">Net Income</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#71717a'}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#71717a'}}
                        tickFormatter={(val) => `$${formatCompactNumber(val)}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [formatCurrency(value), '']}
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
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fair Value & AI Insights */}
              <div className="space-y-8">
                <FairValueGauge 
                  current={selectedStock.price}
                  low={selectedStock.my_fair_low}
                  mid={selectedStock.my_fair_mid}
                  high={selectedStock.my_fair_high}
                />

                <div className="bg-zinc-900 text-white p-8 rounded-2xl border border-zinc-800 shadow-xl">
                  <h3 className="text-lg font-bold mb-6 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
                    Efficiency Metrics
                  </h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">Return on Equity (ROE)</span>
                      <span className="font-mono font-bold text-emerald-400">{selectedStock.roe.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">FCF Yield</span>
                      <span className="font-mono font-bold text-white">{selectedStock.fcf_yield.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">Current Ratio</span>
                      <span className="font-mono font-bold text-white">{selectedStock.current_ratio?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">Debt to Equity</span>
                      <span className="font-mono font-bold text-white">{selectedStock.debt_equity?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="pt-4 border-t border-zinc-800">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-sm">Beta (Volatility)</span>
                        <span className="font-mono font-bold text-white">{selectedStock.beta?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quarterly Table */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Quarterly Breakdown</h3>
                <button className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center">
                  Export CSV <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-950/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Revenue</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Op Income</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Net Income</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">EPS</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gross Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {selectedStock.quarterly_revenue.map((q, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium text-white">{q.date}</td>
                        <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                          {isNaN(q.revenue) ? '-' : formatCurrency(q.revenue)}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                          {isNaN(q.operatingIncome) ? '-' : formatCurrency(q.operatingIncome)}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                          {isNaN(q.netIncome) ? '-' : formatCurrency(q.netIncome)}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                          {isNaN(q.eps) ? '-' : q.eps.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${q.grossMargin}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-white">{q.grossMargin.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">No stocks found. Try importing some data.</p>
          </div>
        )}
      </main>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Import Stock Data</h2>
              <p className="text-zinc-500 text-sm mb-6">Paste your JSON array of stock data below to visualize it.</p>
              
              <textarea 
                className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
                placeholder='[ { "ticker": "AAPL", "name": "Apple Inc.", ... } ]'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsImportOpen(false)}
                  className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleImport}
                  className="px-6 py-2 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  Import Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ComparisonModal 
        isOpen={!!comparisonMetric} 
        onClose={() => setComparisonMetric(null)} 
        metric={comparisonMetric}
        stocks={stocks}
      />
    </div>
  );
}
