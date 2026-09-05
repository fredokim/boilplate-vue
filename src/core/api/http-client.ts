import { ASLEEP_CODE, ASLEEP_STATUS, serverWakeGate } from "./server-wake";
import axios, { AxiosHeaders } from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { analytics } from "@core/analytics";
import { TypedApiError } from "./api-error";
import { createApiResponseDto } from "./api-response.dto";
import type { BaseApiResponseDto } from "./api-response.dto";
import type { DtoConstructor } from "./dto-constructor";
import { hasBeenRetried, markRetried, RefreshSingleFlight } from "./refresh-single-flight";
import { validateDto } from "./validate-dto";

export interface TypedHttpClientOptions {
  baseURL?: string;
  timeout?: number;
}

type AccessTokenProvider = () => string | null;

/**
 * Exchanges the refresh cookie for a new access token, or returns null.
 *
 * Registered from the outside for the same reason the token provider is: this
 * module must not import the auth store, or `core` would depend on `app` and
 * every test touching the client would drag the store in with it.
 *
 * Until something registers one, a 401 is simply a 401.
 */
type TokenRefresher = () => Promise<string | null>;

export class TypedHttpClient {
  private readonly client: AxiosInstance;
  private accessTokenProvider: AccessTokenProvider | null = null;
  private refreshRunner: RefreshSingleFlight | null = null;

  constructor(options: TypedHttpClientOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 10_000,
    });

    this.client.interceptors.request.use(async (config) => {
      // Free of charge unless the server is known to be asleep, in which case
      // this waits for the one probe rather than adding another request to a
      // pile the platform is already refusing.
      await serverWakeGate.wait();

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

    this.client.interceptors.response.use(undefined, async (error: unknown) => {
      const retried = await this.retryAfterRefresh(error);

      if (retried) return retried;

      throw error;
    });
  }

  /**
   * One retry, and only for a 401 on a request that has not already been
   * retried. The flag is what stops a revoked session from looping: refresh,
   * 401, refresh, forever.
   *
   * The refresh itself is single-flighted, because the backend rotates refresh
   * tokens and reads a re-presented one as a replay — five parallel refreshes
   * would revoke the session they were trying to renew.
   */
  private async retryAfterRefresh(error: unknown) {
    if (!axios.isAxiosError(error)) return null;
    if (error.response?.status !== 401) return null;

    const config = error.config;

    if (!config || this.refreshRunner === null || hasBeenRetried(config)) return null;

    const token = await this.refreshRunner.run();

    if (token === null) return null;

    markRetried(config);
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;

    return this.client.request(config);
  }

  setAccessTokenProvider(provider: AccessTokenProvider | null) {
    this.accessTokenProvider = provider;
  }

  setTokenRefresher(refresher: TokenRefresher | null) {
    this.refreshRunner = refresher ? new RefreshSingleFlight(refresher) : null;
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

      /**
       * A 429 with no envelope did not come from the API. This app's own 429s
       * -- the login throttle and the chat rate limit -- are JSON like every
       * other answer, so a body that is not one means the host refused to wake
       * a sleeping instance. The kind stays `http_status`, which is what it is;
       * the code is what tells the reader's message apart.
       */
      const asleep =
        error.response.status === ASLEEP_STATUS &&
        (typeof error.response.data !== "object" || error.response.data === null);

      if (asleep) serverWakeGate.reportAsleep();

      return new TypedApiError(
        "backend",
        "http_status",
        `Backend returned HTTP ${error.response.status}.`,
        {
          ...context,
          status: error.response.status,
          ...(asleep ? { code: ASLEEP_CODE } : {}),
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
