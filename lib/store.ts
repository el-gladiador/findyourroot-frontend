import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabType, Person, User } from './types';
import { FAMILY_DATA } from './data';
import { ApiClient } from './api';

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  addPerson: (person: Omit<Person, 'id'>, parentId?: string) => Promise<string | null>;
  removePerson: (id: string) => Promise<boolean>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<boolean>;
  clearTree: () => Promise<boolean>;
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

      register: async (email: string, password: string, treeName: string, fatherName: string, birthYear: string) => {
        const response = await ApiClient.register(email, password, treeName, fatherName, birthYear);
        
        if (response.data) {
          const { token, user } = response.data;
          ApiClient.setToken(token);
          set({
            isAuthenticated: true,
            user,
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
          const newUser = response.data.user;
          
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
      
      addPerson: async (person, parentId) => {
        if (!get().isAuthenticated) return null;
        
        const response = await ApiClient.createPerson(person, parentId);
        
        if (response.data) {
          // Real-time sync will update the data automatically
          return response.data.id;
        }
        
        return null;
      },
      
      removePerson: async (id) => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.deletePerson(id);
        
        if (!response.error) {
          // Real-time sync will update the data automatically
          return true;
        }
        
        return false;
      },
      
      updatePerson: async (id, updates) => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.updatePerson(id, updates);
        
        if (response.data) {
          // Real-time sync will update the data automatically
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
    }
  )
);
