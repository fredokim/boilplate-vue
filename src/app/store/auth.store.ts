import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { apiClient, isTypedApiError } from "@core/api";
import { tokenStorage } from "@core/auth";
import { fallbackState, parseState } from "@core/state/validate-state";
import { authApi } from "@modules/auth/api/auth.api";
import type { AuthSessionDto, LoginRequest } from "@modules/auth/dto/Auth.dto";
import type { AuthUser, LoadState, StoreFailure } from "./types";
import { authSessionStateSchema, authStateSnapshotSchema } from "./auth.schema";

apiClient.setAccessTokenProvider(() => tokenStorage.getAccessToken());

export const useAuthStore = defineStore("auth", () => {
  const initialSnapshot = fallbackState(
    authStateSnapshotSchema,
    {
      user: null,
      accessToken: tokenStorage.getAccessToken(),
      status: "idle",
      sessionChecked: false,
    },
    {
      user: null,
      accessToken: null,
      status: "idle",
      sessionChecked: false,
    },
    "auth.initial",
  );
  const user = ref<AuthUser | null>(initialSnapshot.user);
  const accessToken = ref<string | null>(initialSnapshot.accessToken);
  const status = ref<LoadState>(initialSnapshot.status);
  const failure = ref<StoreFailure | null>(null);
  const sessionChecked = ref(initialSnapshot.sessionChecked);

  const isAuthenticated = computed(() => Boolean(user.value && accessToken.value));
  const roles = computed(() => user.value?.roles ?? []);
  const permissions = computed(() => roles.value);

  function setSession(session: AuthSessionDto) {
    const nextSession = parseState(authSessionStateSchema, session, "auth.setSession.session");
    const nextSnapshot = parseState(
      authStateSnapshotSchema,
      {
        user: nextSession.user,
        accessToken: nextSession.accessToken,
        status: "success",
        sessionChecked: true,
      },
      "auth.setSession.snapshot",
    );

    user.value = nextSnapshot.user;
    accessToken.value = nextSnapshot.accessToken;
    status.value = "success";
    failure.value = null;
    sessionChecked.value = nextSnapshot.sessionChecked;
    tokenStorage.setTokens({
      accessToken: nextSession.accessToken,
      refreshToken: nextSession.refreshToken,
    });
  }

  function setLoading() {
    status.value = "loading";
    failure.value = null;
  }

  function setFailure(nextFailure: StoreFailure) {
    status.value = "error";
    failure.value = nextFailure;
  }

  function clearSession() {
    const nextSnapshot = parseState(
      authStateSnapshotSchema,
      {
        user: null,
        accessToken: null,
        status: "idle",
        sessionChecked: true,
      },
      "auth.clearSession",
    );
    user.value = nextSnapshot.user;
    accessToken.value = nextSnapshot.accessToken;
    status.value = nextSnapshot.status;
    failure.value = null;
    sessionChecked.value = nextSnapshot.sessionChecked;
    tokenStorage.clear();
  }

  function hasRole(role: string) {
    return roles.value.includes(role);
  }

  function hasPermission(permission: string) {
    return permissions.value.includes(permission) || roles.value.includes("admin");
  }

  function createFailure(error: unknown): StoreFailure {
    return isTypedApiError(error)
      ? {
          code: `${error.origin}:${error.kind}`,
          kind: error.kind,
          message: error.message,
          origin: error.origin,
        }
      : {
          kind: "unknown",
          message: "Unknown authentication error.",
          origin: "frontend",
        };
  }

  async function login(payload: LoginRequest) {
    setLoading();

    try {
      setSession(await authApi.login(payload));
      return true;
    } catch (error) {
      setFailure(createFailure(error));
      return false;
    }
  }

  async function checkSession() {
    if (!accessToken.value) {
      sessionChecked.value = true;
      return false;
    }

    setLoading();

    try {
      setSession(await authApi.fetchSession());
      return true;
    } catch (error) {
      clearSession();
      setFailure(createFailure(error));
      return false;
    }
  }

  async function refreshSession() {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      clearSession();
      return false;
    }

    setLoading();

    try {
      setSession(await authApi.refreshSession(refreshToken));
      return true;
    } catch (error) {
      clearSession();
      setFailure(createFailure(error));
      return false;
    }
  }

  function useDemoSession() {
    setSession({
      accessToken: "demo-access-token",
      refreshToken: "demo-refresh-token",
      user: {
        id: "demo-admin",
        name: "Demo Admin",
        email: "admin@example.com",
        roles: ["admin", "users:read"],
      },
    });
  }

  return {
    accessToken,
    failure,
    isAuthenticated,
    permissions,
    roles,
    sessionChecked,
    status,
    user,
    checkSession,
    clearSession,
    hasPermission,
    hasRole,
    login,
    refreshSession,
    setFailure,
    setLoading,
    setSession,
    useDemoSession,
  };
});
