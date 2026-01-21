"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Radio, Cpu, Trophy, ChevronRight, X } from "lucide-react";

const slides = [
    {
        title: "One Single Password",
        description: "Right now, users around the world are\ncompeting to crack a single password.",
        icon: <Shield className="w-16 h-16 text-blue-400" />,
    },
    {
        title: "Real-time Feed",
        description: "Others' mistakes are your hints.\nWatch the feed and target frequent near-misses.",
        icon: <Radio className="w-16 h-16 text-amber-400" />,
    },
    {
        title: "Don't Just Guess Blindly",
        description: "Computing Power (CP) is limited.\nWait until others get close to the answer.",
        icon: <Cpu className="w-16 h-16 text-emerald-400" />,
    },
    {
        title: "Winner Takes All",
        description: "Crack the block's password to become its owner.\nWin to decide the hint for the next round.",
        icon: <Trophy className="w-16 h-16 text-rose-400" />,
    },
];

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <motion.div
                        className="h-full bg-blue-500"
                        animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                    />
                </div>

                {/* Close Button */}
                <button
                    onClick={onComplete}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-8 pt-12 flex flex-col items-center text-center min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-6 mb-8 flex-1"
                        >
                            <div className="p-6 bg-slate-800/50 rounded-full mb-2">
                                {slides[currentIndex].icon}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {slides[currentIndex].title}
                                </h2>
                                <p className="text-slate-400 leading-relaxed whitespace-pre-line">
                                    {slides[currentIndex].description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="w-full pt-4">
                        <button
                            onClick={handleNext}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all active:scale-[0.98]"
                        >
                            {currentIndex === slides.length - 1 ? (
                                "Start Hacking"
                            ) : (
                                <>
                                    Next <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <div className="mt-4 flex gap-1 justify-center">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? "bg-blue-500" : "bg-slate-700"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
