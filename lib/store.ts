import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TabType, Person, User, Suggestion, needsApproval, canEditDirectly } from './types';
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
  refreshUser: () => Promise<void>;
  
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
  addPerson: (person: Omit<Person, 'id'>, parentId?: string) => Promise<{ id: string | null; isSuggestion: boolean; message?: string }>;
  removePerson: (id: string) => Promise<{ success: boolean; isSuggestion: boolean; message?: string }>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<{ success: boolean; isSuggestion: boolean; message?: string }>;
  updatePersonLocal: (id: string, updates: Partial<Person>) => void;
  clearTree: () => Promise<boolean>;
  
  // Suggestion methods
  createSuggestion: (type: 'add' | 'edit' | 'delete', targetPersonId: string, personData?: any, message?: string) => Promise<{ success: boolean; message?: string }>;
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
      
      refreshUser: async () => {
        const response = await ApiClient.validateToken();
        if (response.data?.valid && response.data.user) {
          set({ user: response.data.user as User });
        }
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
        const user = get().user;
        if (!get().isAuthenticated || !user) return { id: null, isSuggestion: false };
        
        // Contributors create suggestions instead of direct additions
        if (needsApproval(user.role)) {
          const response = await ApiClient.createSuggestion({
            type: 'add',
            target_person_id: parentId || '',
            person_data: {
              name: person.name,
              role: person.role,
              birth: person.birth,
              location: person.location || '',
              avatar: person.avatar,
              bio: person.bio || '',
            },
            message: 'Add new family member',
          });
          
          if (response.data) {
            return { id: null, isSuggestion: true, message: 'Your suggestion to add this person has been submitted for approval.' };
          }
          return { id: null, isSuggestion: true, message: response.error || 'Failed to submit suggestion' };
        }
        
        // Editors and above can add directly
        const response = await ApiClient.createPerson(person, parentId);
        
        if (response.data) {
          // Real-time sync will update UI automatically
          return { id: response.data.id, isSuggestion: false };
        }
        
        return { id: null, isSuggestion: false, message: response.error };
      },
      
      removePerson: async (id) => {
        const user = get().user;
        if (!get().isAuthenticated || !user) return { success: false, isSuggestion: false };
        
        // Contributors create suggestions instead of direct deletions
        if (needsApproval(user.role)) {
          const response = await ApiClient.createSuggestion({
            type: 'delete',
            target_person_id: id,
            message: 'Remove family member',
          });
          
          if (response.data) {
            return { success: true, isSuggestion: true, message: 'Your suggestion to remove this person has been submitted for approval.' };
          }
          return { success: false, isSuggestion: true, message: response.error || 'Failed to submit suggestion' };
        }
        
        // Editors and above can delete directly
        const response = await ApiClient.deletePerson(id);
        
        if (!response.error) {
          // Real-time sync will update UI automatically
          return { success: true, isSuggestion: false };
        }
        
        return { success: false, isSuggestion: false, message: response.error };
      },
      
      updatePerson: async (id, updates) => {
        const user = get().user;
        if (!get().isAuthenticated || !user) return { success: false, isSuggestion: false };
        
        // Contributors create suggestions instead of direct updates
        if (needsApproval(user.role)) {
          const response = await ApiClient.createSuggestion({
            type: 'edit',
            target_person_id: id,
            person_data: {
              name: updates.name || '',
              role: updates.role || '',
              birth: updates.birth || '',
              location: updates.location || '',
              avatar: updates.avatar,
              bio: updates.bio,
            },
            message: 'Edit family member',
          });
          
          if (response.data) {
            return { success: true, isSuggestion: true, message: 'Your suggestion to edit this person has been submitted for approval.' };
          }
          return { success: false, isSuggestion: true, message: response.error || 'Failed to submit suggestion' };
        }
        
        // Editors and above can update directly
        const response = await ApiClient.updatePerson(id, updates);
        
        if (response.data) {
          // Real-time sync will update UI automatically
          return { success: true, isSuggestion: false };
        }
        
        return { success: false, isSuggestion: false, message: response.error };
      },
      
      clearTree: async () => {
        if (!get().isAuthenticated) return false;
        
        const response = await ApiClient.deleteAllPeople();
        
        // Real-time sync will update UI automatically
        return !response.error;
      },
      
      createSuggestion: async (type, targetPersonId, personData, message) => {
        if (!get().isAuthenticated) return { success: false, message: 'Not authenticated' };
        
        const response = await ApiClient.createSuggestion({
          type,
          target_person_id: targetPersonId,
          person_data: personData,
          message,
        });
        
        if (response.data) {
          return { success: true, message: response.data.message || 'Suggestion submitted successfully' };
        }
        
        return { success: false, message: response.error || 'Failed to create suggestion' };
      },
      
      // Optimistic local update for a single person (for likes, etc.)
      updatePersonLocal: (id: string, updates: Partial<Person>) => {
        set((state) => ({
          familyData: state.familyData.map((p) => 
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
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
