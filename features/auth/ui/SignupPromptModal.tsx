"use client";

import { motion, AnimatePresence } from "motion/react";
import { ZapOff, LogIn, UserPlus, X } from "lucide-react";
import Link from "next/link";

interface SignupPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SignupPromptModal({ isOpen, onClose }: SignupPromptModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="p-4 bg-rose-500/10 rounded-full mb-6">
                        <ZapOff className="w-12 h-12 text-rose-500" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-3">
                        Not Enough CP
                    </h2>

                    <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                        Anonymous accounts do not recharge CP automatically.<br />
                        Sign up to continue playing.
                    </p>

                    <div className="w-full space-y-3">
                        <Link
                            href="/auth/signup"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all active:scale-[0.98]"
                        >
                            <UserPlus className="w-4 h-4" />
                            Sign Up
                        </Link>

                        <Link
                            href="/auth/login"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all active:scale-[0.98]"
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
