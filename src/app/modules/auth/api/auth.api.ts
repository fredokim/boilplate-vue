import { apiClient, markRetried } from "@core/api";

import { AuthSessionDto, AuthSessionUserDto, SocialAuthorizeDto } from "../dto/Auth.dto";
import type { LoginRequest, SocialCallbackRequest } from "../dto/Auth.dto";
import type { SocialProvider } from "../social/social-provider";

const basePath = "/api/auth";

export function login(body: LoginRequest) {
  return apiClient.post(`${basePath}/login`, body, AuthSessionDto);
}

export function fetchSession() {
  return apiClient.get(`${basePath}/session`, AuthSessionUserDto);
}

/**
 * Takes no argument. The refresh token is an HttpOnly cookie the browser sends
 * on its own; this used to pass one from local storage, which the server never
 * read.
 */
export function refreshSession() {
  // Marked as already-retried before it is sent. That is not a detail: the
  // response interceptor reacts to a 401 by awaiting the in-flight refresh, and
  // this *is* the in-flight refresh — so a 401 here would leave it awaiting its
  // own promise. Opting out makes an expired refresh cookie surface as a failed
  // refresh instead of a hang.
  return apiClient.post(`${basePath}/refresh`, undefined, AuthSessionDto, markRetried({}));
}

export function fetchSocialAuthorizeUrl(provider: SocialProvider) {
  return apiClient.get(
    `${basePath}/oauth/${provider}/authorize`,
    SocialAuthorizeDto
  );
}

export function completeSocialCallback(
  provider: SocialProvider,
  body: SocialCallbackRequest
) {
  return apiClient.post(
    `${basePath}/oauth/${provider}/callback`,
    body,
    AuthSessionDto
  );
}

export const authApi = {
  completeSocialCallback,
  fetchSession,
  fetchSocialAuthorizeUrl,
  login,
  refreshSession,
};
