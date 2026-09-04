import "reflect-metadata";
import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, ValidateNested } from "class-validator";

import type { DtoConstructor } from "./dto-constructor";

/**
 * The envelope the shared backend actually sends.
 *
 * It used to be `{ status: "SUCCESS" | "FAILURE", code?, message?, data }`,
 * which no response from that server can satisfy — there is no `status` field
 * in it, so validation failed before any call could succeed. The backend is
 * shared by three frontends, so the envelope moves this way and not the other.
 */
export class ApiErrorBodyDto {
  @IsString()
  code!: string;

  @IsString()
  message!: string;
}

export class BaseApiResponseDto<TData> {
  @IsBoolean()
  success!: boolean;

  @ValidateNested()
  @Type(() => ApiErrorBodyDto)
  @IsOptional()
  error?: ApiErrorBodyDto;

  data!: TData;
}

export function createApiResponseDto<TData>(DataDto: DtoConstructor<TData>) {
  class ApiResponseDto extends BaseApiResponseDto<TData> {
    /**
     * Optional because a failure envelope carries `error` and no `data`.
     * Declaring it required would turn every backend error into a validation
     * error, which points at the wrong thing.
     */
    @ValidateNested()
    @Type(() => DataDto)
    @IsOptional()
    declare data: TData;
  }

  return ApiResponseDto as DtoConstructor<BaseApiResponseDto<TData>>;
}
