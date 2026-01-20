import { Header } from "@/widgets";
import { VictoryProvider } from "@/shared/context";
import { MatrixWarpBackground } from "@/shared/ui/BackgroundEffect/MatrixWarpBackground";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VictoryProvider>
      <div className="min-h-screen py-4 px-4 md:py-6 md:px-6 relative isolate">
        <MatrixWarpBackground />
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <Header />
          {children}
        </div>
      </div>
    </VictoryProvider>
  );
}
