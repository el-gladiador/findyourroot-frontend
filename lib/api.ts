// Get API URL - use environment variable or construct from current host
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // In browser, use current hostname with port 8080
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8080`;
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Unauthorized - clear token
        this.setToken(null);
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || 'Request failed',
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
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

  static async validateToken(): Promise<ApiResponse<ValidateResponse>> {
    return this.request<ValidateResponse>('/api/v1/auth/validate', {
      method: 'GET',
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

  static async createPerson(person: any): Promise<ApiResponse<any>> {
    return this.request('/api/v1/tree', {
      method: 'POST',
      body: JSON.stringify(person),
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
}
