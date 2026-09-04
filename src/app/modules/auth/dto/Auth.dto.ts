import "reflect-metadata";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

import type { SocialProvider } from "../social/social-provider";
import { socialProviders } from "../social/social-provider";

const socialProviderValues = socialProviders.map((item) => item.provider);

export class AuthUserDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  /**
   * The server sends permissions, not role names. It used to be `roles` here,
   * which the store then aliased to permissions anyway — the demo session held
   * `["admin", "users:read"]`, one of each.
   */
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}

/**
 * What `POST /auth/login` and `POST /auth/refresh` return.
 *
 * There is no refresh token here, and there never will be: the server keeps it
 * in an HttpOnly cookie and deliberately never puts it in a response body. This
 * DTO used to declare an optional `refreshToken`, so the code below stored a
 * value that was always undefined.
 */
export class AuthSessionDto {
  @ValidateNested()
  @Type(() => AuthUserDto)
  user!: AuthUserDto;

  @IsString()
  accessToken!: string;
}

/**
 * What `GET /auth/session` returns — the user only.
 *
 * Session restore does not mint a new access token. Reusing AuthSessionDto here
 * made the client require an `accessToken` the server does not send, so every
 * session check failed validation.
 */
export class AuthSessionUserDto {
  @ValidateNested()
  @Type(() => AuthUserDto)
  user!: AuthUserDto;
}

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export type LoginRequest = InstanceType<typeof LoginRequestDto>;

export class SocialAuthorizeDto {
  @IsString()
  authorizationUrl!: string;
}

export class SocialCallbackDto extends AuthSessionDto {}

export interface SocialCallbackRequest {
  code: string;
  state?: string;
}

export class SocialProviderDto {
  @IsEnum(socialProviderValues)
  provider!: SocialProvider;
}
