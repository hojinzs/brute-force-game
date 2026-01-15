import { GenesisBlockForm } from "./GenesisBlockForm";

export function GenesisBlockView() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">
            BRUTE FORCE AI
          </h1>
          <p className="text-slate-400 mb-4">
            Global Password Cracking Competition
          </p>
          <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm font-medium">
              No active block found
            </p>
          </div>
        </div>

        <GenesisBlockForm />

        <div className="text-center mt-6 text-slate-500 text-sm">
          <p>First one to create starts the global competition</p>
        </div>
      </div>
    </div>
  );
}
