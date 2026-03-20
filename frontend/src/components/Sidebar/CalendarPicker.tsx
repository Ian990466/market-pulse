import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "../../utils";

interface CalendarPickerProps {
  availableDates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  viewDate: Date;
  setViewDate: (date: Date) => void;
  formatDateString: (dateStr: string) => string;
}

export function CalendarPicker({
  availableDates,
  selectedDate,
  setSelectedDate,
  isCalendarOpen,
  setIsCalendarOpen,
  viewDate,
  setViewDate,
  formatDateString,
}: CalendarPickerProps) {
  return (
    <div className="px-3 mb-6 space-y-3 relative">
      <button
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-left flex items-center justify-between group relative"
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
        <span>{formatDateString(selectedDate)}</span>
        <ChevronRight
          className={cn(
            "w-3 h-3 text-zinc-600 transition-transform",
            isCalendarOpen && "rotate-90",
          )}
        />
      </button>

      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
                  )
                }
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <AnimatePresence mode="wait">
                <motion.span
                  key={viewDate.getMonth()}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-bold text-zinc-200 uppercase tracking-widest"
                >
                  {viewDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </motion.span>
              </AnimatePresence>
              <button
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
                  )
                }
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4 min-h-[180px]">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div
                  key={`${day}-${i}`}
                  className="text-[10px] font-bold text-zinc-600 text-center py-1"
                >
                  {day}
                </div>
              ))}
              {(() => {
                const daysInMonth = new Date(
                  viewDate.getFullYear(),
                  viewDate.getMonth() + 1,
                  0,
                ).getDate();
                const firstDayOfMonth = new Date(
                  viewDate.getFullYear(),
                  viewDate.getMonth(),
                  1,
                ).getDay();
                const days = [];

                for (let i = 0; i < firstDayOfMonth; i++) {
                  days.push(<div key={`empty-${i}`} />);
                }

                for (let d = 1; d <= daysInMonth; d++) {
                  const dateObj = new Date(
                    viewDate.getFullYear(),
                    viewDate.getMonth(),
                    d,
                  );
                  const dateKey = dateObj
                    .toISOString()
                    .split("T")[0]
                    .replace(/-/g, "");
                  const hasReport = availableDates.includes(dateKey);
                  const isSelected = selectedDate === dateKey;
                  const isToday =
                    new Date().toISOString().split("T")[0].replace(/-/g, "") ===
                    dateKey;

                  days.push(
                    <button
                      key={d}
                      disabled={!hasReport}
                      onClick={() => {
                        setSelectedDate(dateKey);
                        setIsCalendarOpen(false);
                      }}
                      className={cn(
                        "text-xs py-1.5 rounded-lg transition-all relative flex items-center justify-center",
                        hasReport
                          ? "text-zinc-200 hover:bg-emerald-500/20 hover:text-emerald-400 cursor-pointer"
                          : "text-zinc-700 cursor-not-allowed",
                        isSelected &&
                          "bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-500 hover:text-zinc-950",
                        isToday &&
                          !isSelected &&
                          "border border-emerald-500/30",
                      )}
                    >
                      {d}
                      {hasReport && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
                      )}
                    </button>,
                  );
                }

                const totalCells = 42;
                for (let i = 0; i < totalCells - days.length; i++) {
                  days.push(<div key={`empty-end-${i}`} />);
                }

                return days;
              })()}
            </div>

            <button
              onClick={() => {
                setSelectedDate("Live");
                setIsCalendarOpen(false);
              }}
              className={cn(
                "w-full py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                selectedDate === "Live"
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
              )}
            >
              Live Data (Current)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Status
        </span>
        {selectedDate && selectedDate !== "Live" ? (
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Report Found
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            Live Data
          </span>
        )}
      </div>
    </div>
  );
}
