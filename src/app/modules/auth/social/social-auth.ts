import type { SocialProvider } from "./social-provider";

export function createSocialAuthorizePath(provider: SocialProvider) {
  return `/api/auth/oauth/${provider}/authorize`;
}

export function createSocialCallbackPath(provider: SocialProvider) {
  return `/auth/callback/${provider}`;
}

