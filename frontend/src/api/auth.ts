import { apiClient, setAccessToken, getAccessToken, isTimeoutError } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<User> => {
    try {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response) {
        // Server responded with error
        throw error;
      } else if (error.request) {
        // No response. A timeout means the request was still in flight -- the
        // demo API is on a free tier that cold-starts after idling -- which is
        // a different situation from the server refusing the connection.
        if (isTimeoutError(error)) {
          throw new Error(
            'The demo backend is waking up from sleep. This can take up to a minute -- please try again shortly.'
          );
        }
        throw new Error('Network error. Please check if the backend is running.');
      } else {
        // Something else happened
        throw error;
      }
    }
  },

  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    try {
      console.log('Making login request...');
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login response received:', response.data);
      const { access_token } = response.data;
      if (!access_token) {
        console.error('No access_token in login response!', response.data);
        throw new Error('No access token received from server');
      }
      console.log('Setting access token, length:', access_token.length);
      setAccessToken(access_token);
      console.log('Token set, verifying...', getAccessToken() ? 'Token exists' : 'Token missing!');
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        // Server responded with error
        throw error;
      } else if (error.request) {
        // No response. A timeout means the request was still in flight -- the
        // demo API is on a free tier that cold-starts after idling -- which is
        // a different situation from the server refusing the connection.
        if (isTimeoutError(error)) {
          throw new Error(
            'The demo backend is waking up from sleep. This can take up to a minute -- please try again shortly.'
          );
        }
        throw new Error('Network error. Please check if the backend is running.');
      } else {
        // Something else happened
        throw error;
      }
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    setAccessToken(null);
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refresh: async (): Promise<TokenResponse> => {
    const response = await apiClient.post('/auth/refresh');
    const { access_token } = response.data;
    setAccessToken(access_token);
    return response.data;
  },
};

