import { create } from "zustand";
import type { BlockWithNicknames } from "@/entities/block";

type GameState = {
  block: BlockWithNicknames | null;
  isLoading: boolean;

  setBlock: (block: BlockWithNicknames | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useGameStore = create<GameState>((set) => ({
  block: null,
  isLoading: true,

  setBlock: (block) => set({ block, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
