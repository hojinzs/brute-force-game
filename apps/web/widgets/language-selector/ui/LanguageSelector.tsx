"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

export function LanguageSelector() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  const handleLanguageChange = (newLocale: string) => {
    setSelectedLanguage(newLocale);
    
    // Set cookie and redirect
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    router.refresh();
  };

  return (
    <div className="bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-slate-200 text-lg font-bold mb-4">{t('settings.languageSettings')}</h3>
      <div className="space-y-2">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedLanguage === language.code
                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </div>
              {selectedLanguage === language.code && (
                <div className="w-4 h-4 bg-blue-500 rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}