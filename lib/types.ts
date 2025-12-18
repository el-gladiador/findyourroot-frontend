export type TabType = 'tree' | 'search' | 'settings' | 'about';

export type UserRole = 'viewer' | 'contributor' | 'editor' | 'co-admin' | 'admin';

export interface Person {
  id: string;
  name: string;
  role: string;
  birth: string;
  location?: string; // Legacy, optional
  avatar: string;
  bio?: string; // Legacy, optional
  children: string[];
  created_by?: string; // User ID of creator
  linked_user_id?: string; // User ID if someone claimed this identity
  instagram_username?: string; // Instagram handle (only shown if linked_user_id is set)
  instagram_avatar_url?: string; // Cached Instagram profile picture URL
  instagram_full_name?: string; // Instagram display name
  instagram_bio?: string; // Instagram bio
  instagram_is_verified?: boolean; // Instagram verified badge
  likes_count?: number; // Number of likes
  liked_by?: string[]; // User IDs who liked
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  tree_name?: string;
  is_verified?: boolean;
  person_id?: string;   // Derived from Person.linked_user_id (Person owns the link)
  person_name?: string; // Name of linked person for display
}

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  tree_name: string;
  is_verified: boolean;
  person_id: string;       // Derived from Person.linked_user_id (Person owns the link)
  person_name?: string;    // Derived person name for display
  created_at: string;
}

export interface PermissionRequest {
  id: string;
  user_id: string;
  user_email: string;
  requested_role: UserRole;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface IdentityClaimRequest {
  id: string;
  user_id: string;
  user_email: string;
  person_id: string;
  person_name: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export type SuggestionType = 'add' | 'edit' | 'delete';

export interface PersonData {
  name: string;
  role: string;
  birth?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  instagram_username?: string;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  target_person_id: string;
  target_person?: Person;
  person_data?: PersonData;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  user_email: string;
  reviewed_by?: string;
  reviewer_email?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupedSuggestion {
  group_id: string;
  type: SuggestionType;
  target_person_id: string;
  target_person?: Person;
  person_data?: PersonData;
  suggestion_ids: string[];
  user_emails: string[];
  count: number;
  first_created_at: string;
  last_created_at: string;
  messages: string[];
  has_conflicts: boolean;
  conflicts_with: string[];
  conflict_type?: string;
}

export interface GroupedSuggestionsResponse {
  groups: GroupedSuggestion[];
  total_count: number;
  group_count: number;
}

export interface CreatorInfo {
  name: string;
  role: string;
  bio: string;
  socials: {
    instagram: string;
    github: string;
    linkedin: string;
  };
}

// Role helpers
export const canApprove = (role: UserRole): boolean => {
  return role === 'co-admin' || role === 'admin';
};

export const canEditDirectly = (role: UserRole): boolean => {
  return role === 'editor' || role === 'co-admin' || role === 'admin';
};

export const canManageUsers = (role: UserRole): boolean => {
  return role === 'admin';
};

export const canSuggest = (role: UserRole): boolean => {
  return role === 'contributor' || role === 'editor' || role === 'co-admin' || role === 'admin';
};

// Contributors can use add/edit/delete buttons but changes create suggestions
export const canContribute = (role: UserRole): boolean => {
  return role === 'contributor' || role === 'editor' || role === 'co-admin' || role === 'admin';
};

// Check if user needs approval for changes (contributors only)
export const needsApproval = (role: UserRole): boolean => {
  return role === 'contributor';
};

export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'viewer': return 'Viewer';
    case 'contributor': return 'Contributor';
    case 'editor': return 'Editor';
    case 'co-admin': return 'Co-Admin';
    case 'admin': return 'Admin';
    default: return role;
  }
};

export const getRoleDescription = (role: UserRole): string => {
  switch (role) {
    case 'viewer': return 'Can only view the tree';
    case 'contributor': return 'Can suggest changes (needs approval)';
    case 'editor': return 'Can edit the tree directly';
    case 'co-admin': return 'Can edit + approve suggestions';
    case 'admin': return 'Full access + manage users';
    default: return '';
  }
};
