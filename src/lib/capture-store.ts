import { create } from "zustand";
import type { DraftItem } from "@/lib/schemas";

// État partagé entre les modes de capture (photo/dictée) et l'écran de review.
type CaptureState = {
  drafts: DraftItem[];
  homeId: string | null;
  roomId: string | null;
  setContext: (homeId: string | null, roomId: string | null) => void;
  setDrafts: (drafts: DraftItem[]) => void;
  updateDraft: (index: number, patch: Partial<DraftItem>) => void;
  removeDraft: (index: number) => void;
  clear: () => void;
};

export const useCaptureStore = create<CaptureState>((set) => ({
  drafts: [],
  homeId: null,
  roomId: null,
  setContext: (homeId, roomId) => set({ homeId, roomId }),
  setDrafts: (drafts) => set({ drafts }),
  updateDraft: (index, patch) =>
    set((s) => ({
      drafts: s.drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    })),
  removeDraft: (index) =>
    set((s) => ({ drafts: s.drafts.filter((_, i) => i !== index) })),
  clear: () => set({ drafts: [] }),
}));
