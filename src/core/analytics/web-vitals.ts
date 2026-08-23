import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";

import { analytics } from "./analytics.service";

function trackMetric(metric: Metric) {
  analytics.trackWebVital({
    id: metric.id,
    name: metric.name,
    rating: metric.rating,
    value: metric.value,
  });
}

export function initWebVitals() {
  onCLS(trackMetric);
  onFCP(trackMetric);
  onINP(trackMetric);
  onLCP(trackMetric);
  onTTFB(trackMetric);
}

