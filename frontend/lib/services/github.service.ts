import api from "@/lib/api/axios";

export interface GitHubAuthUrlResponse {
  url?: string;
  authUrl?: string;
}

export const githubService = {
  async getConnectUrl(): Promise<string> {
    const { data } = await api.get<GitHubAuthUrlResponse | string>(
      "/github/oauth/connect",
    );

    // Handles if backend returns { url: "..." } or plain string URL
    if (typeof data === "string") return data;
    return data.url || data.authUrl || "";
  },
};
