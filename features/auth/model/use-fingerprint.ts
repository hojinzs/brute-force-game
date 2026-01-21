"use client";

import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

export function useFingerprint() {
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setFp = async () => {
            try {
                const fp = await FingerprintJS.load();
                const { visitorId } = await fp.get();
                setVisitorId(visitorId);
            } catch (error) {
                console.error("Failed to load fingerprint:", error);
            } finally {
                setIsLoading(false);
            }
        };

        setFp();
    }, []);

    return { visitorId, isLoading };
}
