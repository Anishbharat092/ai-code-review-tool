import api from "@/lib/api/axios";
import type {
  AuthResponse,
  LoginPayload,
  SignupPayload,
  User,
} from "@/lib/types/auth";

export const authService = {
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/signup", payload);
    return response.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  async refresh(): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/refresh");
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },
};
