export interface User {
  id: string;
  email: string;
  name?: string;
  githubConnected?: boolean;
  githubUsername?: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
