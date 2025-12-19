// Get API URL - use environment variable or construct from current host
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, use current hostname with port 8080
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Always use http for local development (localhost or IP addresses)
    // Only use https for production domains
    const isLocalDev = hostname === 'localhost' || 
                       hostname === '127.0.0.1' || 
                       /^\d+\.\d+\.\d+\.\d+$/.test(hostname); // IP address
    const protocol = isLocalDev ? 'http' : window.location.protocol.replace(':', '');
    return `${protocol}://${hostname}:8080`;
  }
  
  // Fallback for SSR
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    is_admin: boolean;
  };
}

interface ValidateResponse {
  valid: boolean;
  user: {
    id: string;
    email: string;
  };
}

export class ApiClient {
  private static token: string | null = null;

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  static getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`[API] Request to: ${API_BASE_URL}${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors', // Explicitly set CORS mode
      });

      if (response.status === 401) {
        // Unauthorized - clear token
        this.setToken(null);
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(`[API] Error response:`, data);
        return {
          error: data.error || data.message || 'Request failed',
        };
      }

      return { data };
    } catch (error) {
      console.error(`[API] Request failed to ${API_BASE_URL}${endpoint}:`, error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          error: `Cannot connect to server at ${API_BASE_URL}. Please check if the backend is running and accessible from this device.`,
        };
      }
      
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  static async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(
    email: string, 
    password: string, 
    treeName: string, 
    fatherName: string, 
    birthYear: string
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        tree_name: treeName, 
        father_name: fatherName, 
        birth_year: birthYear 
      }),
    });
  }

  static async validateToken(): Promise<ApiResponse<ValidateResponse>> {
    return this.request<ValidateResponse>('/api/v1/auth/validate', {
      method: 'GET',
    });
  }

  static async requestPermission(requestedRole: string, message?: string): Promise<ApiResponse<any>> {
    return this.request('/api/v1/auth/request-permission', {
      method: 'POST',
      body: JSON.stringify({ requested_role: requestedRole, message }),
    });
  }

  // Admin endpoints
  static async getPermissionRequests(status = 'pending'): Promise<ApiResponse<any[]>> {
    return this.request(`/api/v1/admin/permission-requests?status=${status}`, {
      method: 'GET',
    });
  }

  static async approvePermissionRequest(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/permission-requests/${id}/approve`, {
      method: 'POST',
    });
  }

  static async rejectPermissionRequest(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/permission-requests/${id}/reject`, {
      method: 'POST',
    });
  }

  // User management endpoints (admin only)
  static async getAllUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/admin/users', {
      method: 'GET',
    });
  }

  static async updateUserRole(userId: string, role: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  static async revokeUserAccess(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/users/${userId}/access`, {
      method: 'DELETE',
    });
  }

  // Suggestion endpoints (contributors)
  static async createSuggestion(suggestion: {
    type: 'add' | 'edit' | 'delete';
    target_person_id?: string;
    person_data?: {
      name: string;
      role: string;
      gender?: string;
      birth: string;
      location: string;
      avatar?: string;
      bio?: string;
    };
    message?: string;
  }): Promise<ApiResponse<{ id: string; message: string }>> {
    return this.request('/api/v1/suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestion),
    });
  }

  static async getMySuggestions(status?: string): Promise<ApiResponse<any[]>> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/v1/suggestions/my${params}`, {
      method: 'GET',
    });
  }

  // Admin/co-admin suggestion endpoints
  static async getAllSuggestions(status = 'pending'): Promise<ApiResponse<any[]>> {
    return this.request(`/api/v1/admin/suggestions?status=${status}`, {
      method: 'GET',
    });
  }

  static async getGroupedSuggestions(status = 'pending'): Promise<ApiResponse<{
    groups: any[];
    total_count: number;
    group_count: number;
  }>> {
    return this.request(`/api/v1/admin/suggestions/grouped?status=${status}`, {
      method: 'GET',
    });
  }

  static async reviewSuggestion(id: string, approved: boolean, reviewNotes?: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/suggestions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved, review_notes: reviewNotes }),
    });
  }

  static async batchReviewSuggestions(suggestionIds: string[], approved: boolean, reviewNotes?: string): Promise<ApiResponse<{
    message: string;
    success_count: number;
    fail_count: number;
  }>> {
    return this.request('/api/v1/admin/suggestions/batch-review', {
      method: 'POST',
      body: JSON.stringify({ 
        suggestion_ids: suggestionIds, 
        approved, 
        review_notes: reviewNotes 
      }),
    });
  }

  // Tree endpoints
  static async getAllPeople(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/tree', {
      method: 'GET',
    });
  }

  static async getPerson(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/tree/${id}`, {
      method: 'GET',
    });
  }

  static async createPerson(person: any, parentId?: string): Promise<ApiResponse<any>> {
    const payload = { ...person };
    if (parentId) {
      payload.parent_id = parentId;
      console.log('[API] Creating person with parent_id:', parentId, 'Payload:', payload);
    } else {
      console.log('[API] Creating root person (no parent_id). Payload:', payload);
    }
    return this.request('/api/v1/tree', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Populate tree from indentation-based text (admin only)
  static async populateTreeFromText(text: string): Promise<ApiResponse<{ created_count: number; people: any[] }>> {
    return this.request('/api/v1/tree/populate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Check for duplicate names using phonetic matching for Persian names
  static async checkDuplicateName(name: string, threshold: number = 0.8): Promise<ApiResponse<{
    has_duplicates: boolean;
    matches: Array<{
      person_id: string;
      name: string;
      similarity: number;
      match_type: string; // "exact", "normalized", "phonetic", "similar"
    }>;
    input_name: string;
    normalized: string;
  }>> {
    return this.request('/api/v1/tree/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ name, threshold }),
    });
  }

  static async updatePerson(id: string, updates: any): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/tree/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  static async deletePerson(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/tree/${id}`, {
      method: 'DELETE',
    });
  }

  static async deleteAllPeople(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/tree/all', {
      method: 'DELETE',
    });
  }

  // Like/Unlike person endpoints
  static async likePerson(personId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/tree/${personId}/like`, {
      method: 'POST',
    });
  }

  static async unlikePerson(personId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/v1/tree/${personId}/like`, {
      method: 'DELETE',
    });
  }

  // Search endpoints
  static async searchPeople(params: {
    q?: string;
    location?: string;
    role?: string;
    yearFrom?: string;
    yearTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<{
    data: any[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.location) searchParams.set('location', params.location);
    if (params.role) searchParams.set('role', params.role);
    if (params.yearFrom) searchParams.set('year_from', params.yearFrom);
    if (params.yearTo) searchParams.set('year_to', params.yearTo);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.pageSize) searchParams.set('page_size', params.pageSize.toString());
    
    return this.request(`/api/v1/search?${searchParams.toString()}`, {
      method: 'GET',
    });
  }

  static async getLocations(): Promise<ApiResponse<{ locations: string[] }>> {
    return this.request('/api/v1/search/locations', {
      method: 'GET',
    });
  }

  static async getRoles(): Promise<ApiResponse<{ roles: string[] }>> {
    return this.request('/api/v1/search/roles', {
      method: 'GET',
    });
  }

  // Export endpoints
  static async exportJSON(): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/export/json`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'family-tree.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  static async exportCSV(): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/export/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'family-tree.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  static async exportText(): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/export/text`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'family-tree.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  // Identity claim endpoints
  static async claimIdentity(personId: string, message?: string): Promise<ApiResponse<any>> {
    return this.request('/api/v1/identity/claim', {
      method: 'POST',
      body: JSON.stringify({ person_id: personId, message }),
    });
  }

  static async getMyIdentityClaim(): Promise<ApiResponse<{
    linked: boolean;
    person?: any;
    claim?: any;
  }>> {
    return this.request('/api/v1/identity/my-claim', {
      method: 'GET',
    });
  }

  // Admin identity claim endpoints
  static async getIdentityClaims(status = 'pending'): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/admin/identity-claims?status=${status}`, {
      method: 'GET',
    });
  }

  static async reviewIdentityClaim(id: string, approved: boolean, reviewNotes?: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/identity-claims/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved, review_notes: reviewNotes }),
    });
  }

  static async unlinkIdentity(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/identity-claims/unlink/${userId}`, {
      method: 'DELETE',
    });
  }

  // Admin link user to person (without user request) - admin only
  static async linkUserToPerson(userId: string, personId: string, instagramUsername?: string): Promise<ApiResponse<any>> {
    return this.request('/api/v1/admin/link-user-to-person', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        person_id: personId,
        instagram_username: instagramUsername,
      }),
    });
  }

  // Update person's Instagram username - admin only (for any linked person)
  static async updatePersonInstagram(personId: string, instagramUsername: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/admin/person/${personId}/instagram`, {
      method: 'PUT',
      body: JSON.stringify({ instagram_username: instagramUsername }),
    });
  }

  // Update own Instagram username (for user's linked tree node)
  static async updateMyInstagram(instagramUsername: string): Promise<ApiResponse<{ message: string; username: string }>> {
    return this.request(`/api/v1/identity/my-instagram`, {
      method: 'PUT',
      body: JSON.stringify({ instagram_username: instagramUsername }),
    });
  }

  // Lookup Instagram profile - admin only
  static async lookupInstagramProfile(username: string): Promise<ApiResponse<{
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    is_verified: boolean;
  }>> {
    return this.request(`/api/v1/admin/instagram/lookup?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  }
}
