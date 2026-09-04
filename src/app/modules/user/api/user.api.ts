import { apiClient } from "@core/api";

import { UserDto } from "../dto/User.dto";
import type { CreateUserRequest } from "../dto/User.dto";

const basePath = "/api/users";

export function fetchUser(id: string) {
  return apiClient.get(`${basePath}/${id}`, UserDto);
}

export function createUser(body: CreateUserRequest) {
  return apiClient.post(basePath, body, UserDto);
}

export const userApi = {
  create: createUser,
  fetch: fetchUser,
};

