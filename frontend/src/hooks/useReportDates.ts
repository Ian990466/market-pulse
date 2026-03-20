import { useState, useEffect } from "react";

export function useReportDates(selectedTicker: string) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTicker) return;
    fetch(`/api/reports/${selectedTicker}/dates`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = data.sort().reverse();
          setAvailableDates(sorted);
          setSelectedDate(sorted[0]);
          const latestDate = sorted[0];
          const year = parseInt(latestDate.slice(0, 4));
          const month = parseInt(latestDate.slice(4, 6)) - 1;
          const day = parseInt(latestDate.slice(6, 8));
          setViewDate(new Date(year, month, day));
          setError(null);
        } else {
          setAvailableDates([]);
          setSelectedDate("");
        }
      })
      .catch(() => {
        setAvailableDates([]);
        setSelectedDate("");
        setError("Failed to load report dates.");
      });
  }, [selectedTicker]);

  const formatDateString = (dateStr: string) => {
    if (dateStr === "Live") return "Live Data";
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  return {
    availableDates,
    selectedDate,
    setSelectedDate,
    isCalendarOpen,
    setIsCalendarOpen,
    viewDate,
    setViewDate,
    formatDateString,
    error,
  };
}
