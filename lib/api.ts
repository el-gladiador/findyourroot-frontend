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

  static async register(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async validateToken(): Promise<ApiResponse<ValidateResponse>> {
    return this.request<ValidateResponse>('/api/v1/auth/validate', {
      method: 'GET',
    });
  }

  static async requestPermission(requestedRole: 'editor' | 'admin', message?: string): Promise<ApiResponse<any>> {
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
    }
    return this.request('/api/v1/tree', {
      method: 'POST',
      body: JSON.stringify(payload),
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
}
