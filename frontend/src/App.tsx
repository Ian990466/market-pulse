import { ErrorBoundary } from "./components/ErrorBoundary";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { MainContent } from "./components/MainContent";
import { ComparisonModal } from "./components/ComparisonModal";
import { useStocks } from "./hooks/useStocks";
import { useReportDates } from "./hooks/useReportDates";
import { useStockReport } from "./hooks/useStockReport";

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const {
    stocks,
    setStocks,
    selectedTicker,
    setSelectedTicker,
    searchQuery,
    setSearchQuery,
    selectedStock,
    filteredStocks,
    comparisonMetric,
    setComparisonMetric,
    error: stocksError,
  } = useStocks();

  const {
    availableDates,
    selectedDate,
    setSelectedDate,
    isCalendarOpen,
    setIsCalendarOpen,
    viewDate,
    setViewDate,
    formatDateString,
  } = useReportDates(selectedTicker);

  const { isReportLoading, error: reportError } = useStockReport(
    selectedTicker,
    selectedDate,
    setStocks,
  );

  const error = stocksError || reportError;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <Sidebar
        filteredStocks={filteredStocks}
        selectedTicker={selectedTicker}
        onSelectTicker={setSelectedTicker}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableDates={availableDates}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isCalendarOpen={isCalendarOpen}
        setIsCalendarOpen={setIsCalendarOpen}
        viewDate={viewDate}
        setViewDate={setViewDate}
        formatDateString={formatDateString}
      />

      <MainContent
        stock={selectedStock}
        selectedDate={selectedDate}
        isLoading={isReportLoading}
        onCompare={setComparisonMetric}
        error={error}
      />

      <ComparisonModal
        isOpen={!!comparisonMetric}
        onClose={() => setComparisonMetric(null)}
        metric={comparisonMetric}
        stocks={stocks}
      />
    </div>
  );
}
