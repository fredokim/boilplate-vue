import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { isTypedApiError } from "@core/api";
import { parseState } from "@core/state/validate-state";
import type { StoreFailure, LoadState } from "@store/types";
import { userApi } from "../api/user.api";
import { UserRole } from "../dto/User.dto";
import type { UserDto } from "../dto/User.dto";
import { userStateSchema, userStoreSnapshotSchema } from "./user.schema";

const sampleUser: UserDto = parseState(
  userStateSchema,
  {
  id: "user-demo",
  name: "DashStack Admin",
  email: "admin@example.com",
  roles: [UserRole.Admin],
  },
  "user.sample",
);

export const useUserStore = defineStore("user", () => {
  const user = ref<UserDto | null>(sampleUser);
  const status = ref<LoadState>("idle");
  const failure = ref<StoreFailure | null>(null);

  const isLoading = computed(() => status.value === "loading");
  const isReady = computed(() => status.value === "success" && user.value !== null);

  async function loadUser(id: string) {
    status.value = "loading";
    failure.value = null;

    try {
      const nextUser = parseState(userStateSchema, await userApi.fetch(id), "user.loadUser");
      const nextSnapshot = parseState(
        userStoreSnapshotSchema,
        {
          user: nextUser,
          status: "success",
        },
        "user.loadUser.snapshot",
      );
      user.value = nextSnapshot.user;
      status.value = nextSnapshot.status;
    } catch (error) {
      status.value = "error";
      failure.value = isTypedApiError(error)
        ? {
            code: `${error.origin}:${error.kind}`,
            kind: error.kind,
            message: error.message,
            origin: error.origin,
          }
        : {
            kind: "unknown",
            message: "Unknown user loading error.",
            origin: "frontend",
          };
    }
  }

  function useDemoUser() {
    const nextSnapshot = parseState(
      userStoreSnapshotSchema,
      {
        user: sampleUser,
        status: "success",
      },
      "user.useDemoUser",
    );
    user.value = nextSnapshot.user;
    status.value = nextSnapshot.status;
    failure.value = null;
  }

  return {
    failure,
    isLoading,
    isReady,
    loadUser,
    status,
    useDemoUser,
    user,
  };
});
