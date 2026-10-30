export interface DisplayConfig {
  mode: string;
  renderer: string;
  order?: string;
  [key: string]: unknown;
}

export interface StateMappingEntry {
  responsePath: string;
  requestPath: string;
  defaultValue: unknown;
}

export interface DashboardModule {
  moduleId: string;
  name: string;
  duration: number;
  enabled: boolean;
  dataSource?: "api" | "configuration";
  staticData?: Record<string, unknown>;
  refreshTime?: number;
  city?: string;
  payload?: Record<string, unknown>;
  display?: DisplayConfig;
  stateMapping?: Record<string, StateMappingEntry>;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DashboardConfiguration {
  version: number;
  brightness: number;
  modules: DashboardModule[];
}

export interface Credentials {
  username: string;
  password: string;
}
