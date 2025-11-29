import { create } from 'zustand';
import { IContentLibrary } from '@/lib/models/ContentLibrary';

interface ContentState {
  library: IContentLibrary[];
  dailyIdeas: {
    reelIdeas: string[];
    photoIdeas: string[];
    hooks: string[];
    captions: string[];
    trendingAudios: string[];
    cachedAt?: Date;
  } | null;
  setLibrary: (library: IContentLibrary[]) => void;
  addToLibrary: (content: IContentLibrary) => void;
  removeFromLibrary: (id: string) => void;
  setDailyIdeas: (ideas: ContentState['dailyIdeas']) => void;
  clearDailyIdeas: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  library: [],
  dailyIdeas: null,
  setLibrary: (library) => set({ library }),
  addToLibrary: (content) => set((state) => ({ library: [...state.library, content] })),
  removeFromLibrary: (id) =>
    set((state) => ({
      library: state.library.filter((c) => c._id.toString() !== id),
    })),
  setDailyIdeas: (ideas) => set({ dailyIdeas: ideas }),
  clearDailyIdeas: () => set({ dailyIdeas: null }),
}));

