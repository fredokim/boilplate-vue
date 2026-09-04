export type SocialProvider = "google" | "kakao" | "naver" | "facebook";

export interface SocialProviderConfig {
  provider: SocialProvider;
  label: string;
  enabled: boolean;
}

export const socialProviders: SocialProviderConfig[] = [
  {
    provider: "google",
    label: "Continue with Google",
    enabled: false,
  },
  {
    provider: "kakao",
    label: "Continue with Kakao",
    enabled: false,
  },
  {
    provider: "naver",
    label: "Continue with Naver",
    enabled: false,
  },
  {
    provider: "facebook",
    label: "Continue with Facebook",
    enabled: false,
  },
];

export function isSocialProvider(value: string): value is SocialProvider {
  return socialProviders.some((item) => item.provider === value);
}

