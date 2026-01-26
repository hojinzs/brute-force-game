"use client";

import { useEffect, useState } from "react";
import { type CharsetType } from "@/shared/lib/charset";
import { useAuth } from "@/features/auth";
import { useCPGauge } from "@/features/cp-gauge";
import { useFingerprint } from "@/features/auth/model/use-fingerprint";
import { OnboardingModal } from "@/widgets/onboarding";
import { SignupPromptModal } from "@/features/auth/ui/SignupPromptModal";
import { AuthenticationRequiredBlock } from "@/features/auth/ui/AuthenticationRequiredBlock";
import { SignInModal } from "@/features/auth/ui/SignInModal";
import { HackingConsole } from "./HackingConsole";
import { useRouter } from "next/navigation";

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
        !!user?.is_anonymous
    );
    const { visitorId, isLoading: isFingerprintLoading } = useFingerprint();

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showSignupPrompt, setShowSignupPrompt] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const router = useRouter();

    // Initial Session Check
    useEffect(() => {
        if (authLoading || isFingerprintLoading) return;

        const checkSession = async () => {
            const onboardingCompleted = localStorage.getItem("brute-force-onboarding-completed");

            if (!onboardingCompleted) {
                setShowOnboarding(true);
                // Mark as seen immediately so it doesn't reappear on refresh
                localStorage.setItem("brute-force-onboarding-completed", "true");
                setIsInitializing(false);
            } else {
                setIsInitializing(false);
            }
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
            try {
                await signInAnonymously(visitorId || undefined);
            } catch (error) {
                console.error("Failed to sign in anonymously:", error);
            }
        }
    };

    const handleGuestLogin = async () => {
        try {
            await signInAnonymously(visitorId || undefined);
        } catch (error) {
            console.error("Failed to sign in anonymously:", error);
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
            {user ? (
                <HackingConsole
                    length={length}
                    charset={charset}
                    disabled={isConsoleDisabled}
                    onSubmit={onSubmit}
                    currentCP={currentCP}
                    maxCP={maxCP}
                />
            ) : (
                <AuthenticationRequiredBlock
                    onGuestLogin={handleGuestLogin}
                    onJoin={() => router.push("/auth/signup")}
                    onSignIn={() => setShowSignIn(true)}
                />
            )}

            <OnboardingModal 
                isOpen={showOnboarding} 
                onComplete={handleOnboardingComplete} 
                onClose={() => setShowOnboarding(false)} 
            />
            <SignupPromptModal 
                isOpen={showSignupPrompt} 
                onClose={() => setShowSignupPrompt(false)} 
                onLogin={() => {
                    setShowSignupPrompt(false);
                    setShowSignIn(true);
                }}
            />
            <SignInModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
        </>
    );
}
