import { create } from 'zustand';
import { ICampaign } from '@/lib/models/Campaign';

// Plain type without Mongoose Document properties
type CampaignPlain = Omit<ICampaign, keyof Document> & { _id: string };

interface CampaignState {
  drafts: CampaignPlain[];
  currentDraft: Partial<CampaignPlain> | null;
  setCurrentDraft: (draft: Partial<CampaignPlain> | null) => void;
  updateCurrentDraft: (updates: Partial<CampaignPlain>) => void;
  setDrafts: (drafts: CampaignPlain[]) => void;
  addDraft: (draft: CampaignPlain) => void;
  updateDraft: (id: string, updates: Partial<CampaignPlain>) => void;
  removeDraft: (id: string) => void;
  clearCurrentDraft: () => void;
}

export const useCampaignStore = create<CampaignState>((set) => ({
  drafts: [],
  currentDraft: null,
  setCurrentDraft: (draft) => set({ currentDraft: draft }),
  updateCurrentDraft: (updates) =>
    set((state) => ({
      currentDraft: state.currentDraft ? { ...state.currentDraft, ...updates } : updates,
    })),
  setDrafts: (drafts) => set({ drafts }),
  addDraft: (draft) => set((state) => ({ drafts: [...state.drafts, draft] })),
  updateDraft: (id, updates) =>
    set((state) => ({
      drafts: state.drafts.map((d) => (d._id === id ? { ...d, ...updates } : d)),
    })),
  removeDraft: (id) =>
    set((state) => ({
      drafts: state.drafts.filter((d) => d._id !== id),
    })),
  clearCurrentDraft: () => set({ currentDraft: null }),
}));

