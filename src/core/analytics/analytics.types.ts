export type AnalyticsEventName =
  | "api_request"
  | "route_change"
  | "page_view"
  | "web_vital";

export type AnalyticsProperties = Record<
  string,
  boolean | number | string | null | undefined
>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties: AnalyticsProperties;
  timestamp: number;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void;
}

export interface ApiRequestAnalytics {
  durationMs: number;
  errorKind?: string;
  errorOrigin?: string;
  method?: string;
  status?: number;
  success: boolean;
  url?: string;
}

export interface RouteChangeAnalytics {
  durationMs: number;
  from: string;
  title?: string;
  to: string;
}

export interface WebVitalAnalytics {
  id: string;
  name: string;
  rating: string;
  value: number;
}

