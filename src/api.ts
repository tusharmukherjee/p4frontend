import type { Credentials, DashboardConfiguration, DashboardModule, ModuleCatalogEntry } from "./types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function authorization(credentials: Credentials): string {
  const bytes = new TextEncoder().encode(`${credentials.username}:${credentials.password}`);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

async function request<T>(path: string, credentials: Credentials, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authorization(credentials),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new ApiError(body.error ?? `Request failed (${response.status})`, response.status);
  return body as T;
}

export const configurationApi = {
  get: (credentials: Credentials) => request<DashboardConfiguration>("/api/configuration", credentials),
  catalog: (credentials: Credentials) => request<{ modules: ModuleCatalogEntry[] }>("/api/module-catalog", credentials),
  update: (credentials: Credentials, expectedVersion: number, brightness: number, modules: DashboardModule[]) =>
    request<DashboardConfiguration>("/api/configuration", credentials, {
      method: "PUT",
      body: JSON.stringify({ expectedVersion, brightness, modules }),
    }),
};

export interface FootballCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  area: { name: string; code: string | null };
}

export interface FootballTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
}

export const footballApi = {
  tokenStatus: (credentials: Credentials) =>
    request<{ configured: boolean }>("/api/football/token", credentials),
  saveToken: (credentials: Credentials, token: string) =>
    request<{ configured: boolean }>("/api/football/token", credentials, {
      method: "PUT", body: JSON.stringify({ token }),
    }),
  competitions: (credentials: Credentials) =>
    request<{ competitions: FootballCompetition[] }>("/api/football/competitions", credentials),
  teams: (credentials: Credentials, code: string) =>
    request<{ teams: FootballTeam[] }>(`/api/football/competitions/${encodeURIComponent(code)}/teams`, credentials),
};

export interface OAuthStatus {
  connected: boolean;
  expiresAt: string | null;
  scopes: string | null;
}

export const integrationsApi = {
  status: (credentials: Credentials) =>
    request<{ spotify: OAuthStatus; google: OAuthStatus }>("/api/integrations", credentials),
  authorize: (credentials: Credentials, provider: "spotify" | "google") =>
    request<{ authorizationUrl: string }>(`/api/integrations/${provider}/authorize`, credentials, {
      method: "POST",
    }),
};
