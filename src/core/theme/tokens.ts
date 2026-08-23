export const colorKeys = [
  "primary",
  "secondary",
  "accent",
  "error",
  "success",
  "warning",
  "info",
] as const;

export const darkTheme = {
  primary: "#5b8cff",
  secondary: "#6c5dd3",
  accent: "#ff7f5c",
  success: "#34d399",
  error: "#f87171",
  warning: "#fbbf24",
  info: "#60a5fa",
  background: "#111827",
  text: "#f8fafc",
};

export const lightTheme = {
  primary: "#4880ff",
  secondary: "#6c5dd3",
  accent: "#ff7f5c",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  background: "#f5f6fa",
  text: "#202224",
};

export const spacingTokens = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
} as const;

export const radiusTokens = {
  none: "0",
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  full: "999px",
} as const;

export const shadowTokens = {
  sm: "0 1px 2px rgb(15 23 42 / 0.08)",
  md: "0 8px 24px rgb(15 23 42 / 0.1)",
  lg: "0 18px 48px rgb(15 23 42 / 0.14)",
} as const;

export const typographyTokens = {
  fontSans: '"Inter", "Pretendard", system-ui, sans-serif',
  textXs: "0.75rem",
  textSm: "0.875rem",
  textMd: "1rem",
  textLg: "1.125rem",
  textXl: "1.25rem",
  text2xl: "1.5rem",
} as const;

export const zIndexTokens = {
  dropdown: "1000",
  sticky: "1020",
  overlay: "1040",
  modal: "1050",
  toast: "1080",
} as const;

export const designTokens = {
  radius: radiusTokens,
  shadow: shadowTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  zIndex: zIndexTokens,
} as const;
