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

export type ScheduleDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type AnimationId =
  | "asteroid-earth" | "aquarium" | "campfire" | "cat-and-fly"
  | "dragon-eye" | "earth-and-sun" | "messi-barca" | "moon-stars"
  | "moving-car" | "moving-stars" | "sleepy-cat" | "solar-system";

export interface ScheduleConfig extends Record<string, unknown> {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  days: ScheduleDay[];
}

export interface DashboardModule {
  moduleId: string;
  name: string;
  duration: number;
  enabled: boolean;
  dataSource?: "api" | "configuration";
  staticData?: Record<string, unknown>;
  schedule?: ScheduleConfig;
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
