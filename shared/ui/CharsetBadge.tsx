import { type CharsetType, CHARSET_LABELS } from "@/shared/lib/charset";

type CharsetBadgeProps = {
  type: CharsetType;
  className?: string;
};

export function CharsetBadge({ type, className = "" }: CharsetBadgeProps) {
  const label = CHARSET_LABELS[type];
  
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        w-8 h-8 rounded bg-[#0f172a] border border-slate-700
        text-slate-400 font-medium font-mono text-[10px]
        ${className}
      `}
      title={label.full}
    >
      <span>{label.short}</span>
    </div>
  );
}
