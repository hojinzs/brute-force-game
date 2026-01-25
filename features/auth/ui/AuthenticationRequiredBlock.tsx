import { Lock } from "lucide-react";

interface AuthenticationRequiredBlockProps {
    onJoin: () => void;
    onSignIn: () => void;
}

export function AuthenticationRequiredBlock({
    onJoin,
    onSignIn,
}: AuthenticationRequiredBlockProps) {
    return (
        <div className="w-full max-w-4xl mx-auto min-h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-md">
                <div className="p-5 bg-slate-800/50 rounded-full mb-8 ring-1 ring-slate-700 shadow-lg">
                    <Lock className="w-12 h-12 text-blue-400" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                    Authentication Required
                </h2>
                
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    To access the brute-force terminal and contribute to the decryption process, you must be a registered agent.
                </p>

                <div className="flex flex-col w-full gap-3 sm:flex-row sm:gap-4 justify-center">
                    <button
                        onClick={onSignIn}
                        className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] w-full sm:w-auto min-w-[160px]"
                    >
                        Sign In
                    </button>

                    <button
                        onClick={onJoin}
                        className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-all border border-slate-700 active:scale-[0.98] w-full sm:w-auto min-w-[140px]"
                    >
                        Join the Game
                    </button>
                </div>

                <button
                    onClick={onJoin}
                    className="mt-6 text-slate-500 hover:text-blue-400 text-sm font-medium transition-colors"
                >
                    Don't have an account? Join the Game
                </button>
            </div>
        </div>
    );
}
