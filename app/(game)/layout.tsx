import { Header } from "@/widgets";
import { SoundInitializer } from "@/shared/sounds/sound-initializer";
import { VictoryProvider } from "@/shared/context";
import { MatrixWarpBackground } from "@/shared/ui/BackgroundEffect/MatrixWarpBackground";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VictoryProvider>
      <div className="min-h-screen py-4 px-4 md:py-6 md:px-6 relative isolate bg-(--bg-color)">
        <MatrixWarpBackground speed={65} density={3000} />
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          <SoundInitializer />
          <Header />
          {children}
        </div>
      </div>
    </VictoryProvider>
  );
}
