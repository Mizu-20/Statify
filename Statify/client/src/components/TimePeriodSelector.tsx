import { useTimeRange } from "../context/TimeRangeContext";

export default function TimePeriodSelector() {
  const { timeRange, setTimeRange } = useTimeRange();
  
  return (
    <div className="mb-6 border-b border-border">
      <div className="flex space-x-4">
        <button 
          onClick={() => setTimeRange("short_term")}
          className={`pb-2 px-1 font-medium border-b-2 transition-all ${
            timeRange === "short_term" 
              ? "text-white border-primary active-tab" 
              : "text-muted-foreground border-transparent hover:text-white hover:border-white/20"
          }`}
        >
          Last Month
        </button>
        <button 
          onClick={() => setTimeRange("medium_term")}
          className={`pb-2 px-1 font-medium border-b-2 transition-all ${
            timeRange === "medium_term" 
              ? "text-white border-primary active-tab" 
              : "text-muted-foreground border-transparent hover:text-white hover:border-white/20"
          }`}
        >
          Last 6 Months
        </button>
        <button 
          onClick={() => setTimeRange("long_term")}
          className={`pb-2 px-1 font-medium border-b-2 transition-all ${
            timeRange === "long_term" 
              ? "text-white border-primary active-tab" 
              : "text-muted-foreground border-transparent hover:text-white hover:border-white/20"
          }`}
        >
          All Time
        </button>
      </div>
    </div>
  );
}
