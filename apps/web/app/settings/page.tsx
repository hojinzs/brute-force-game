import { LanguageSelector } from "@/widgets/language-selector/ui/LanguageSelector";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations();
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-8">{t('settings.title')}</h1>
        <div className="space-y-6">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}