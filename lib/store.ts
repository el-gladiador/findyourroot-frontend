import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabType, Person, User } from './types';
import { ApiClient } from './api';

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, treeName: string, fatherName: string, birthYear: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  validateAuth: () => Promise<boolean>;
  
  // App state
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  focusedPersonId: string | null;
  setFocusedPersonId: (id: string | null) => void;
  settings: {
    theme: 'light' | 'dark' | 'system';
    animationsEnabled: boolean;
    language: string;
  };
  updateSettings: (newSettings: Partial<AppState['settings']>) => void;
  
  // Family data state
  familyData: Person[];
  isLoadingData: boolean;
  fetchFamilyData: () => Promise<void>;
  addPerson: (person: Omit<Person, 'id'>, parentId?: string) => Promise<string | null>;
  removePerson: (id: string) => Promise<boolean>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<boolean>;
  clearTree: () => Promise<boolean>;
}

// Helper to apply theme to document
const applyThemeToDOM = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      isAuthenticated: false,
      user: null,
      token: null,
      
      login: async (email: string, password: string) => {
        const response = await ApiClient.login(email, password);
        
        if (response.data) {
          const { token, user } = response.data;
          ApiClient.setToken(token);
          set({
            isAuthenticated: true,
            user: user as User,
            token,
          });
          
          // Fetch family data after successful login
          await get().fetchFamilyData();
          
          return { success: true };
        }
        
        return { success: false, error: response.error || 'Login failed' };
      },

      register: async (email: string, password: string, treeName: string, fatherName: string, birthYear: string) => {
        const response = await ApiClient.register(email, password, treeName, fatherName, birthYear);
        
        if (response.data) {
          const { token, user } = response.data;
          ApiClient.setToken(token);
          set({
            isAuthenticated: true,
            user: user as User,
            token,
          });
          
          // Fetch family data after successful registration
          await get().fetchFamilyData();
          
          return { success: true };
        }
        
        return { success: false, error: response.error || 'Registration failed' };
      },
      
      logout: () => {
        ApiClient.setToken(null);
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          familyData: [],
        });
      },
      
      validateAuth: async () => {
        const token = ApiClient.getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }
        
        const response = await ApiClient.validateToken();
        
        if (response.data?.valid) {
          const currentUser = get().user;
          const newUser = response.data.user as User;
          
          // Check if user role changed
          if (currentUser && currentUser.role !== newUser.role) {
            console.log('[Auth] User role changed:', currentUser.role, '->', newUser.role);
          }
          
          set({
            isAuthenticated: true,
            user: newUser,
            token,
          });
          
          // Fetch family data after validation
          await get().fetchFamilyData();
          
          return true;
        }
        
        // Token is invalid
        get().logout();
        return false;
      },
      
      // App state
      currentTab: 'tree',
      setCurrentTab: (tab) => set({ currentTab: tab }),
      focusedPersonId: null,
      setFocusedPersonId: (id) => set({ focusedPersonId: id }),
      settings: {
        theme: 'system',
        animationsEnabled: true,
        language: 'en',
      },
      updateSettings: (newSettings) => {
        // If theme is being updated, apply it immediately to DOM
        if (newSettings.theme) {
          applyThemeToDOM(newSettings.theme);
          localStorage.setItem('theme', newSettings.theme);
        }
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      // Family data state
      familyData: [],
      isLoadingData: false,
      
      fetchFamilyData: async () => {
        if (!get().isAuthenticated) return;
        
        set({ isLoadingData: true });
        const response = await ApiClient.getAllPeople();
        
        if (response.data) {
          // Normalize data to ensure children is always an array
          const normalizedData = response.data.map((person: any) => ({
            ...person,
            children: person.children || []
          }));
          set({ familyData: normalizedData, isLoadingData: false });
        } else {
          set({ isLoadingData: false });
        }
      },
      
      addPerson: async (person, parentId) => {
        if (!get().isAuthenticated) return null;
        
        const response = await ApiClient.createPerson(person, parentId);
        
        if (response.data) {
          // Refetch data to ensure UI is updated with parent-child relationship
          await get().fetchFamilyData();
          return response.data.id;
        }
        
        return null;
      },
      
      removePerson: async (id) => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.deletePerson(id);
        
        if (!response.error) {
          // Refetch data to ensure UI is updated
          await get().fetchFamilyData();
          return true;
        }
        
        return false;
      },
      
      updatePerson: async (id, updates) => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.updatePerson(id, updates);
        
        if (response.data) {
          // Refetch data to ensure UI is updated
          await get().fetchFamilyData();
          return true;
        }
        
        return false;
      },
      
      clearTree: async () => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.deleteAllPeople();
        
        if (!response.error) {
          set({ familyData: [] });
          return true;
        }
        
        return false;
      },
      
      // Internal method for real-time sync to update data directly
      setFamilyData: (data: Person[]) => {
        set({ familyData: data });
      },
    }),
    {
      name: 'family-tree-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after store rehydrates from localStorage
        if (state?.settings?.theme) {
          applyThemeToDOM(state.settings.theme);
        }
      },
    }
  )
);
