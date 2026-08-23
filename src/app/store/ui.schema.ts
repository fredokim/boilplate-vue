import { z } from "zod";

export const breadcrumbStateSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1).optional(),
});

export const uiPageMetaSchema = z.object({
  pageTitle: z.string(),
  breadcrumbs: z.array(breadcrumbStateSchema),
});

export const uiStateSnapshotSchema = z.object({
  sidebarOpen: z.boolean(),
  pageTitle: z.string(),
  breadcrumbs: z.array(breadcrumbStateSchema),
  globalLoadingCount: z.number().int().min(0),
});

export type BreadcrumbState = z.infer<typeof breadcrumbStateSchema>;
export type UiPageMeta = z.infer<typeof uiPageMetaSchema>;
export type UiStateSnapshot = z.infer<typeof uiStateSnapshotSchema>;
