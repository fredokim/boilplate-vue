import "reflect-metadata";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";

import { ApiErrorCodeEnum, ApiStatusEnum } from "@shared/enum/result.enum";
import type { DtoConstructor } from "./dto-constructor";

export class BaseApiResponseDto<TData> {
  @IsEnum(ApiStatusEnum)
  status!: ApiStatusEnum;

  @IsEnum(ApiErrorCodeEnum)
  @IsOptional()
  code?: ApiErrorCodeEnum;

  @IsString()
  @IsOptional()
  message?: string;

  data!: TData;
}

export function createApiResponseDto<TData>(DataDto: DtoConstructor<TData>) {
  class ApiResponseDto extends BaseApiResponseDto<TData> {
    @ValidateNested()
    @Type(() => DataDto)
    declare data: TData;
  }

  return ApiResponseDto as DtoConstructor<BaseApiResponseDto<TData>>;
}
