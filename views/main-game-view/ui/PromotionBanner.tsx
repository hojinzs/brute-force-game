import Link from "next/link";

export function PromotionBanner() {
  return (
    <div className="flex justify-center mb-4 md:mb-8">
      <Link
        href="/"
        className="
          flex items-center gap-2 md:gap-3 px-4 py-1.5 md:px-6 md:py-2.5 rounded-full
          bg-linear-to-r from-cyan-500 to-blue-500
          hover:from-cyan-400 hover:to-blue-400
          transition-all duration-300
          shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40
          group
        "
      >
        <span className="text-lg md:text-xl">🎉</span>
        <span className="text-white font-bold tracking-wide text-xs md:text-sm">
          BETA TESTING
        </span>
        <svg 
          className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/80 group-hover:translate-x-0.5 transition-transform" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  );
}
