import axios, { AxiosHeaders } from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { analytics } from "@core/analytics";
import { TypedApiError } from "./api-error";
import { createApiResponseDto } from "./api-response.dto";
import type { BaseApiResponseDto } from "./api-response.dto";
import type { DtoConstructor } from "./dto-constructor";
import { validateDto } from "./validate-dto";

export interface TypedHttpClientOptions {
  baseURL?: string;
  timeout?: number;
}

type AccessTokenProvider = () => string | null;

export class TypedHttpClient {
  private readonly client: AxiosInstance;
  private accessTokenProvider: AccessTokenProvider | null = null;

  constructor(options: TypedHttpClientOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 10_000,
    });

    this.client.interceptors.request.use((config) => {
      const token = this.accessTokenProvider?.();

      if (token) {
        const headers = AxiosHeaders.from(config.headers);

        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        config.headers = headers;
      }

      return config;
    });
  }

  setAccessTokenProvider(provider: AccessTokenProvider | null) {
    this.accessTokenProvider = provider;
  }

  get<TData>(
    url: string,
    DataDto: DtoConstructor<TData>,
    config?: AxiosRequestConfig
  ) {
    return this.request<TData>({ ...config, method: "GET", url }, DataDto);
  }

  post<TData, TBody = unknown>(
    url: string,
    body: TBody,
    DataDto: DtoConstructor<TData>,
    config?: AxiosRequestConfig<TBody>
  ) {
    return this.request<TData>(
      {
        ...config,
        method: "POST",
        url,
        data: body,
      },
      DataDto
    );
  }

  async request<TData>(
    config: AxiosRequestConfig,
    DataDto: DtoConstructor<TData>
  ): Promise<TData> {
    const method = config.method?.toUpperCase();
    const url = config.url;
    const startedAt = getNow();

    try {
      const response = await this.client.request<unknown>(config);
      const ResponseDto = createApiResponseDto(DataDto);
      const dto = validateDto<BaseApiResponseDto<TData>>(
        response.data,
        ResponseDto,
        { method, url }
      );

      if (!dto.success) {
        throw new TypedApiError(
          "backend",
          "business_status",
          dto.error?.message ?? "Backend returned a failed business status.",
          {
            method,
            url,
            code: dto.error?.code,
            raw: response.data,
          }
        );
      }

      analytics.trackApiRequest({
        durationMs: getNow() - startedAt,
        method,
        status: response.status,
        success: true,
        url,
      });

      return dto.data;
    } catch (error) {
      const typedError = this.toTypedApiError(error, { method, url });

      analytics.trackApiRequest({
        durationMs: getNow() - startedAt,
        errorKind: typedError.kind,
        errorOrigin: typedError.origin,
        method,
        status: typedError.context.status,
        success: false,
        url,
      });

      throw typedError;
    }
  }

  private toTypedApiError(
    error: unknown,
    context: { method?: string; url?: string }
  ): TypedApiError {
    if (error instanceof TypedApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      return this.fromAxiosError(error, context);
    }

    return new TypedApiError("frontend", "unknown", "Unknown frontend API error.", {
      ...context,
      cause: error,
    });
  }

  private fromAxiosError(
    error: AxiosError,
    context: { method?: string; url?: string }
  ): TypedApiError {
    if (error.response) {
      // The code is pulled out of the failure envelope. Without this it stays
      // buried in `raw`, and callers that need to tell "not signed in" from any
      // other 401 have to reach into an untyped blob to do it.
      const body = error.response.data as { error?: { code?: string } } | undefined;

      return new TypedApiError(
        "backend",
        "http_status",
        `Backend returned HTTP ${error.response.status}.`,
        {
          ...context,
          status: error.response.status,
          ...(body?.error?.code === undefined ? {} : { code: body.error.code }),
          raw: error.response.data,
          cause: error,
        }
      );
    }

    if (error.request) {
      return new TypedApiError(
        "frontend",
        "network",
        "Request was sent, but no response was received.",
        {
          ...context,
          cause: error,
        }
      );
    }

    return new TypedApiError(
      "frontend",
      "request_setup",
      "Request could not be created by the frontend.",
      {
        ...context,
        cause: error,
      }
    );
  }
}

function getNow() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export const apiClient = new TypedHttpClient();
