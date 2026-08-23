import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";

import { TypedApiError } from "./api-error";
import type { DtoConstructor } from "./dto-constructor";

export function validateDto<TDto>(
  raw: unknown,
  Dto: DtoConstructor<TDto>,
  context: { method?: string; url?: string } = {}
): TDto {
  const dto = plainToInstance(Dto, raw);
  const validationErrors = validateSync(dto as object, {
    forbidNonWhitelisted: true,
    whitelist: true,
  });

  if (validationErrors.length > 0) {
    throw new TypedApiError(
      "backend",
      "response_contract",
      "Backend response does not match the frontend DTO contract.",
      {
        ...context,
        raw,
        validationErrors,
      }
    );
  }

  return dto;
}
