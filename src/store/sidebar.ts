import { create } from 'zustand';

export interface SidebarLog {
  id: string;
  title: string;
  kind: string;
}

export interface SidebarCharacter {
  id: string;
  name: string;
  emoji: string | null;
  themeColor: string;
  logs: SidebarLog[];
}

export interface SidebarCategory {
  id: string;
  name: string;
  color: string;
  characters: SidebarCharacter[];
}

interface SidebarState {
  categories: SidebarCategory[];
  loading: boolean;
  // Collapsed state
  collapsedCategories: Set<string>;
  collapsedCharacters: Set<string>;
  collapsedLogs: Set<string>;
  // Actions
  fetch: () => Promise<void>;
  toggleCategory: (id: string) => void;
  toggleCharacter: (id: string) => void;
  toggleLogs: (id: string) => void;
  refresh: () => Promise<void>;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  categories: [],
  loading: true,
  collapsedCategories: new Set(),
  collapsedCharacters: new Set(),
  collapsedLogs: new Set(),

  fetch: async () => {
    set({ loading: true });
    const res = await fetch('/api/sidebar');
    if (res.ok) {
      const data = await res.json();
      set({ categories: data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  refresh: async () => {
    const res = await fetch('/api/sidebar');
    if (res.ok) {
      const data = await res.json();
      set({ categories: data });
    }
  },

  toggleCategory: (id) => {
    const s = new Set(get().collapsedCategories);
    s.has(id) ? s.delete(id) : s.add(id);
    set({ collapsedCategories: s });
  },

  toggleCharacter: (id) => {
    const s = new Set(get().collapsedCharacters);
    s.has(id) ? s.delete(id) : s.add(id);
    set({ collapsedCharacters: s });
  },

  toggleLogs: (id) => {
    const s = new Set(get().collapsedLogs);
    s.has(id) ? s.delete(id) : s.add(id);
    set({ collapsedLogs: s });
  },
}));
