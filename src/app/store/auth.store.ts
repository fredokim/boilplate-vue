import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { apiClient, isTypedApiError } from "@core/api";
import { tokenStorage } from "@core/auth";
import { fallbackState, parseState } from "@core/state/validate-state";
import { authApi } from "@modules/auth/api/auth.api";
import type { AuthSessionDto, LoginRequest } from "@modules/auth/dto/Auth.dto";
import type { AuthUser, LoadState, StoreFailure } from "./types";
import { authSessionStateSchema, authStateSnapshotSchema, authUserStateSchema } from "./auth.schema";

apiClient.setAccessTokenProvider(() => tokenStorage.getAccessToken());

/**
 * Lets an expired access token recover instead of ending the session.
 *
 * A failed refresh clears the session rather than leaving the store holding a
 * token the server has stopped honouring — a state where the UI looks signed in
 * and every request 401s.
 */
apiClient.setTokenRefresher(async () => {
  try {
    const session = await authApi.refreshSession();

    useAuthStore().setSession(session);
    return session.accessToken;
  } catch {
    useAuthStore().clearSession();
    return null;
  }
});

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
  const permissions = computed(() => user.value?.permissions ?? []);
  /** Kept as an alias so existing call sites keep working. The server sends permissions. */
  const roles = permissions;

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
    // Access token only. The refresh token is an HttpOnly cookie the browser
    // manages; JavaScript never sees it, so there is nothing to store.
    tokenStorage.setTokens({ accessToken: nextSession.accessToken });
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
      // The session endpoint returns the user and no token: it confirms who the
      // current access token belongs to, it does not mint a new one. Replacing
      // the whole session here would demand an accessToken the server never
      // sends.
      const { user: currentUser } = await authApi.fetchSession();

      user.value = parseState(authUserStateSchema, currentUser, "auth.checkSession.user");
      status.value = "success";
      failure.value = null;
      sessionChecked.value = true;
      return true;
    } catch (error) {
      clearSession();
      setFailure(createFailure(error));
      return false;
    }
  }

  async function refreshSession() {
    setLoading();

    try {
      // No argument and no local check for a stored token: the refresh token is
      // an HttpOnly cookie. Its absence shows up as a 401 from the server, which
      // is the only place that can actually tell.
      setSession(await authApi.refreshSession());
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
      user: {
        id: "demo-admin",
        name: "Demo Admin",
        email: "admin@example.com",
        permissions: ["dashboard:read", "user:read"],
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
