import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { StockData } from '../types';

export const ComparisonModal = ({ 
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
