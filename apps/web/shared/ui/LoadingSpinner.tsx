"use client";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  message?: string;
};

const sizeClasses = {
  sm: "w-8 h-8 border-2",
  md: "w-12 h-12 border-3",
  lg: "w-16 h-16 border-4",
};

export function LoadingSpinner({ size = "lg", message }: LoadingSpinnerProps) {
  return (
    <div className="text-center">
      <div
        className={`inline-block ${sizeClasses[size]} border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4`}
      />
      {message && <p className="text-slate-400">{message}</p>}
    </div>
  );
}
