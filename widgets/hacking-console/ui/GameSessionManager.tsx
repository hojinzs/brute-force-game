"use client";

import { useEffect, useState } from "react";
import { type CharsetType } from "@/shared/lib/charset";
import { useAuth, hasEverLoggedIn } from "@/features/auth";
import { useCPGauge } from "@/features/cp-gauge";
import { useFingerprint } from "@/features/auth/model/use-fingerprint";
import { OnboardingModal } from "@/widgets/onboarding";
import { SignupPromptModal } from "@/features/auth/ui/SignupPromptModal";
import { HackingConsole } from "./HackingConsole";

type GameSessionManagerProps = {
    length: number;
    charset: CharsetType[];
    baseDisabled: boolean;
    onSubmit: (value: string) => Promise<{ similarity: number; isCorrect: boolean } | null>;
};

export function GameSessionManager({
    length,
    charset,
    baseDisabled,
    onSubmit,
}: GameSessionManagerProps) {
    const { user, loading: authLoading, signInAnonymously } = useAuth();
    const { current: currentCP, max: maxCP, isLoading: isCPLoading } = useCPGauge(
        user?.id,
        user?.is_anonymous
    );
    const { visitorId, isLoading: isFingerprintLoading } = useFingerprint();

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Initial Session Check
    useEffect(() => {
        if (authLoading || isFingerprintLoading) return;

        const checkSession = async () => {
            const onboardingCompleted = localStorage.getItem("brute-force-onboarding-completed");

            if (!onboardingCompleted) {
                setShowOnboarding(true);
                setIsInitializing(false);
                return;
            }

            if (!user) {
                // 정식 로그인 이력이 있으면 게스트 유저 생성 안 함 (로그아웃 상태 유지)
                if (!hasEverLoggedIn()) {
                    // Try to sign in anonymously if not logged in
                    try {
                        // Pass visitorId as metadata for abuse tracking
                        await signInAnonymously(visitorId || undefined);
                    } catch (error) {
                        console.error("Failed to sign in anonymously:", error);
                        // Stay logged out if failed (e.g. blocked by backend in future)
                    }
                }
            }

            setIsInitializing(false);
        };

        checkSession();
    }, [authLoading, isFingerprintLoading, user, signInAnonymously, visitorId]);

    // Check for CP depletion
    useEffect(() => {
        if (user?.is_anonymous && !isCPLoading && currentCP === 0 && !showOnboarding) {
            setShowSignupPrompt(true);
        }
    }, [user, currentCP, isCPLoading, showOnboarding]);

    const handleOnboardingComplete = async () => {
        localStorage.setItem("brute-force-onboarding-completed", "true");
        setShowOnboarding(false);

        if (!user) {
            // 온보딩 완료 후에는 정식 로그인 이력 없이 게스트 유저 생성
            try {
                await signInAnonymously(visitorId || undefined);
            } catch (error) {
                console.error("Failed to sign in anonymously:", error);
            }
        }
    };

    const isConsoleDisabled =
        baseDisabled ||
        isInitializing ||
        authLoading ||
        (currentCP <= 0 && !isCPLoading) || // Check CP 
        showOnboarding ||
        !user; // Disable until logged in (even anonymous)

    if (isInitializing && !user && !showOnboarding) {
        // Optional: Loading state specific to the console area
        // For now, we can show the console but disabled or a loading indicator
    }

    return (
        <>
            <HackingConsole
                length={length}
                charset={charset}
                disabled={isConsoleDisabled}
                onSubmit={onSubmit}
                currentCP={currentCP}
                maxCP={maxCP}
                isCPLoading={isCPLoading}
            />

            <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
            <SignupPromptModal isOpen={showSignupPrompt} onClose={() => setShowSignupPrompt(false)} />
        </>
    );
}
