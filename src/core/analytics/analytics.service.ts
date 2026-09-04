import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsProperties,
  AnalyticsProvider,
  ApiRequestAnalytics,
  RouteChangeAnalytics,
  WebVitalAnalytics,
} from "./analytics.types";

class NoopAnalyticsProvider implements AnalyticsProvider {
  track() {
    // Intentionally empty. Replace with GA, GTM, PostHog, Sentry, or OTel later.
  }
}

class AnalyticsService {
  private provider: AnalyticsProvider = new NoopAnalyticsProvider();

  setProvider(provider: AnalyticsProvider) {
    this.provider = provider;
  }

  track(name: AnalyticsEventName, properties: AnalyticsProperties = {}) {
    const event: AnalyticsEvent = {
      name,
      properties: sanitizeProperties(properties),
      timestamp: Date.now(),
    };

    this.provider.track(event);
  }

  trackApiRequest(properties: ApiRequestAnalytics) {
    this.track("api_request", { ...properties });
  }

  trackPageView(path: string, title?: string) {
    this.track("page_view", {
      path,
      title,
    });
  }

  trackRouteChange(properties: RouteChangeAnalytics) {
    this.track("route_change", { ...properties });
  }

  trackWebVital(properties: WebVitalAnalytics) {
    this.track("web_vital", { ...properties });
  }
}

function sanitizeProperties(properties: AnalyticsProperties) {
  const blockedKeys = new Set([
    "authorization",
    "password",
    "refreshToken",
    "token",
  ]);
  const next: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    next[key] = blockedKeys.has(key) ? "[redacted]" : value;
  }

  return next;
}

export const analytics = new AnalyticsService();
