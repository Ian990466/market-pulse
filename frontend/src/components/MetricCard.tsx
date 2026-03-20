import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MetricCard = ({ title, value, subValue, icon: Icon, trend, onClick }: { 
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
