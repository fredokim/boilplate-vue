import { onScopeDispose, readonly, ref } from "vue";

export type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(width: number): Breakpoint {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useBreakpoint() {
  const breakpoint = ref<Breakpoint>(getBreakpoint(window.innerWidth));

  const onResize = () => {
    breakpoint.value = getBreakpoint(window.innerWidth);
  };

  window.addEventListener("resize", onResize, { passive: true });
  onScopeDispose(() => window.removeEventListener("resize", onResize));

  return readonly(breakpoint);
}
