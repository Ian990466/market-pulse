import { LayoutDashboard, Search } from "lucide-react";
import { StockData } from "../../types";
import { CalendarPicker } from "./CalendarPicker";
import { WatchlistItem } from "./WatchlistItem";

interface SidebarProps {
  filteredStocks: StockData[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableDates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  formatDateString: (dateStr: string) => string;
}

export function Sidebar({
  filteredStocks,
  selectedTicker,
  onSelectTicker,
  searchQuery,
  onSearchChange,
  availableDates,
  selectedDate,
  setSelectedDate,
  isCalendarOpen,
  setIsCalendarOpen,
  viewDate,
  setViewDate,
  formatDateString,
}: SidebarProps) {
  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <LayoutDashboard className="text-zinc-950 w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">
            StockScope
          </h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search ticker..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-zinc-600"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          View Mode
        </div>

        <CalendarPicker
          availableDates={availableDates}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isCalendarOpen={isCalendarOpen}
          setIsCalendarOpen={setIsCalendarOpen}
          viewDate={viewDate}
          setViewDate={setViewDate}
          formatDateString={formatDateString}
        />

        <div className="px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
          Watchlist
        </div>
        {filteredStocks.map((stock) => (
          <WatchlistItem
            key={stock.ticker}
            stock={stock}
            isSelected={selectedTicker === stock.ticker}
            onSelect={() => onSelectTicker(stock.ticker)}
          />
        ))}
      </nav>
    </aside>
  );
}
