export type TabType = 'tree' | 'search' | 'settings' | 'about';

export type UserRole = 'viewer' | 'contributor' | 'editor' | 'co-admin' | 'admin';

export interface Person {
  id: string;
  name: string;
  role: string;
  birth: string;
  location: string;
  avatar: string;
  bio: string;
  children: string[];
  created_by?: string; // User ID of creator
  linked_user_id?: string; // User ID if someone claimed this identity
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  tree_name?: string;
  is_verified?: boolean;
  person_id?: string; // Linked tree node ID if user claimed identity
}

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  tree_name: string;
  is_verified: boolean;
  person_id: string;
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
  birth: string;
  location: string;
  avatar?: string;
  bio?: string;
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

export interface CreatorInfo {
  name: string;
  role: string;
  bio: string;
  socials: {
    twitter: string;
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
