import { Header } from "@/widgets";
import { VictoryProvider } from "@/shared/context";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VictoryProvider>
      <div className="min-h-screen bg-[#0f172a] py-4 px-4 md:py-6 md:px-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <Header />
          {children}
        </div>
      </div>
    </VictoryProvider>
  );
}
