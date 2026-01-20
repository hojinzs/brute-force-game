"use client";

type CPGaugeBarProps = {
  current: number;
  max: number;
  refillRateText?: string;
};

export function CPGaugeBar({
  current,
  max,
  refillRateText = "+1 CP per minute",
}: CPGaugeBarProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const fillColorClass = percentage <= 20 ? "bg-red-500" : percentage <= 50 ? "bg-amber-500" : "bg-blue-500";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 min-w-[80px]">
        <span className="text-slate-500 font-mono text-sm font-bold">CP</span>
        <span className="text-slate-300 font-mono text-sm">
          {current}/{max}
        </span>
      </div>
      
      <div className="flex-1 h-4 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/30">
        <div
          className={`h-full ${fillColorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="relative group cursor-help">
        <div className="w-5 h-5 rounded-full border border-slate-600 text-slate-500 flex items-center justify-center text-xs font-serif italic hover:border-slate-400 hover:text-slate-300 transition-colors">
          i
        </div>
        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-slate-200 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
          {refillRateText}
          <div className="absolute right-2 top-full border-4 border-transparent border-t-slate-800" />
        </div>
      </div>
    </div>
  );
}
