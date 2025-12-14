import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabType, Person } from './types';
import { FAMILY_DATA } from './data';
import { ApiClient } from './api';

interface User {
  id: string;
  email: string;
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // Family data state
  familyData: Person[];
  isLoadingData: boolean;
  fetchFamilyData: () => Promise<void>;
  addPerson: (person: Omit<Person, 'id'>) => Promise<string | null>;
  removePerson: (id: string) => Promise<boolean>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<boolean>;
}

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
            user,
            token,
          });
          
          // Fetch family data after successful login
          await get().fetchFamilyData();
          
          return { success: true };
        }
        
        return { success: false, error: response.error || 'Login failed' };
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
          set({
            isAuthenticated: true,
            user: response.data.user,
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
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // Family data state
      familyData: [],
      isLoadingData: false,
      
      fetchFamilyData: async () => {
        if (!get().isAuthenticated) return;
        
        set({ isLoadingData: true });
        const response = await ApiClient.getAllPeople();
        
        if (response.data) {
          set({ familyData: response.data, isLoadingData: false });
        } else {
          set({ isLoadingData: false });
        }
      },
      
      addPerson: async (person) => {
        if (!get().isAuthenticated) return null;
        
        const response = await ApiClient.createPerson(person);
        
        if (response.data) {
          set((state) => ({
            familyData: [...state.familyData, response.data],
          }));
          return response.data.id;
        }
        
        return null;
      },
      
      removePerson: async (id) => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.deletePerson(id);
        
        if (!response.error) {
          set((state) => ({
            familyData: state.familyData.filter((p) => p.id !== id).map((p) => ({
              ...p,
              children: p.children.filter((childId) => childId !== id),
            })),
          }));
          return true;
        }
        
        return false;
      },
      
      updatePerson: async (id, updates) => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.updatePerson(id, updates);
        
        if (response.data) {
          set((state) => ({
            familyData: state.familyData.map((p) =>
              p.id === id ? { ...p, ...response.data } : p
            ),
          }));
          return true;
        }
        
        return false;
      },
    }),
    {
      name: 'family-tree-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        token: state.token,
      }),
    }
  )
);
