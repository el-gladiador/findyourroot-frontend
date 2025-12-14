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
}

export interface User {
  id: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  is_admin: boolean;
  tree_name?: string;
  is_verified?: boolean;
}

export interface PermissionRequest {
  id: string;
  user_id: string;
  user_email: string;
  requested_role: 'editor' | 'admin';
  message: string;
  status: 'pending' | 'approved' | 'rejected';
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
