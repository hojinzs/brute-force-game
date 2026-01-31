"use client";

import { useTranslations } from "next-intl";
import { useBlockSubscription } from "@/entities/block/model/use-block-subscription";
import { useEffect } from "react";

export function WaitingGenesisView() {
  const t = useTranslations("waiting");
  const { data: blockEvent } = useBlockSubscription();

  useEffect(() => {
    if (blockEvent?.status === "ACTIVE") {
      window.location.reload();
    }
  }, [blockEvent]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center" data-testid="waiting-genesis">
      <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-12 flex flex-col items-center justify-center max-w-2xl shadow-xl">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-white mb-4">
            {t("title")}
          </h1>
          
          <p className="text-slate-300 text-lg leading-relaxed">
            {t("description")}
          </p>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono">{t("standby")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
