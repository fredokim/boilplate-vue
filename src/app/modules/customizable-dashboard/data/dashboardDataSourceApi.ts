import { apiClient } from "@core/api";

import type { DataSourceParameter } from "./dashboardDataSource";
import { KpiDataDto, SeriesDataDto, TableDataDto } from "./dashboardDataSource.dto";

type Parameters = Record<string, DataSourceParameter>;

export const dashboardDataSourceApi = {
  salesSummary: (parameters: Parameters) => apiClient.get("/api/dashboard/kpi", KpiDataDto, { params: parameters }),
  trafficSeries: (parameters: Parameters) => apiClient.get("/api/dashboard/chart", SeriesDataDto, { params: parameters }),
  recentEvents: (parameters: Parameters) => apiClient.get("/api/dashboard/table", TableDataDto, { params: parameters }),
};
