import { getTranslations } from "next-intl/server";
import { RankingClient } from "./_components/RankingClient";

export async function generateMetadata() {
  const t = await getTranslations();
  
  return {
    title: `${t('ranking.title')} - Brute Force AI`,
    description: t('ranking.description'),
  };
}

export default function RankingPage() {
  return <RankingClient />;
}
