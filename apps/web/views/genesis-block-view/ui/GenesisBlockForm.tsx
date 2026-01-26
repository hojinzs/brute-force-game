"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGenesisBlock } from "@/features/generate-block";

export function GenesisBlockForm() {
  const router = useRouter();
  const [seedHint, setSeedHint] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const result = await createGenesisBlock(seedHint);
      console.log("Genesis block created:", result);

      router.refresh();
    } catch (err) {
      console.error("Failed to create genesis block:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create genesis block"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-bold text-slate-50 mb-2">
        Create Genesis Block
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Be the first to start the game by creating the initial block. Enter a
        theme hint for the AI to generate the password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="seedHint"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Theme Hint
          </label>
          <input
            id="seedHint"
            type="text"
            value={seedHint}
            onChange={(e) => setSeedHint(e.target.value)}
            placeholder="e.g., space adventure, cyberpunk, fantasy..."
            className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            disabled={isCreating}
          />
          <p className="text-slate-500 text-xs mt-1">
            Optional - leave empty for random theme
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creating Genesis Block...
            </span>
          ) : (
            "Create Genesis Block"
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">
          What happens next?
        </h3>
        <ul className="text-slate-400 text-xs space-y-1">
          <li>AI generates a password based on your hint</li>
          <li>The password is hashed and stored securely</li>
          <li>Players worldwide compete to crack it</li>
          <li>Winner creates the next block with their own hint</li>
        </ul>
      </div>
    </div>
  );
}
