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

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-400 text-sm">Computing Power</span>
        <span className="text-slate-50 font-mono text-sm">
          {current}/{max}
        </span>
      </div>
      <div className="h-1 bg-[#334155] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-slate-500 text-xs mt-1">{refillRateText}</p>
    </div>
  );
}
