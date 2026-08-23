import type { BaseApiResponseDto } from "@core/api";
import { isTypedApiError, TypedApiError, validateDto } from "@core/api";
import { ApiStatusEnum } from "@shared/enum/result.enum";

export interface ApiResultFailure {
  code?: string;
  message: string;
  origin: "frontend" | "backend";
  kind: string;
}

export async function useApiResult<TData, TRaw = unknown>(
  request: Promise<TRaw>,
  ResponseDto: new () => BaseApiResponseDto<TData>,
  onError?: (failure: ApiResultFailure) => void
): Promise<TData | null> {
  try {
    const raw = await request;
    const dto = validateDto(raw, ResponseDto);

    if (dto.status !== ApiStatusEnum.SUCCESS) {
      onError?.({
        code: dto.code,
        message: dto.message ?? "Backend returned a failed business status.",
        origin: "backend",
        kind: "business_status",
      });
      return null;
    }

    return dto.data;
  } catch (error: unknown) {
    const typedError = isTypedApiError(error)
      ? error
      : new TypedApiError("frontend", "unknown", "Unknown API result error.", {
          cause: error,
        });

    console.error("[useApiResult] Error:", typedError);
    onError?.({
      code: typedError.context.code,
      message: typedError.message,
      origin: typedError.origin,
      kind: typedError.kind,
    });
    return null;
  }
}
