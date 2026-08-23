import "reflect-metadata";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
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

  @IsArray()
  @IsString({ each: true })
  roles!: string[];
}

export class AuthSessionDto {
  @ValidateNested()
  @Type(() => AuthUserDto)
  user!: AuthUserDto;

  @IsString()
  accessToken!: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
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
