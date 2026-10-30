import type { Credentials, DashboardConfiguration, DashboardModule } from "./types";

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
  update: (credentials: Credentials, expectedVersion: number, brightness: number, modules: DashboardModule[]) =>
    request<DashboardConfiguration>("/api/configuration", credentials, {
      method: "PUT",
      body: JSON.stringify({ expectedVersion, brightness, modules }),
    }),
};
