import { Header } from "@/widgets";

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f172a] py-4 px-4 md:py-6 md:px-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <Header />
        {children}
      </div>
    </div>
  );
}
