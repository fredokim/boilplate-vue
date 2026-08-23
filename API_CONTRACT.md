# API Contract

All typed API responses should use the shared envelope shape.

```ts
interface ApiResponse<TData> {
  status: "SUCCESS" | "FAILURE";
  code?: string;
  message?: string;
  data: TData;
}
```

## Error Ownership

- `frontend:network`: request sent but no response was received.
- `frontend:request_setup`: request could not be created.
- `frontend:unknown`: unexpected frontend-side issue.
- `backend:http_status`: backend responded with non-2xx status.
- `backend:business_status`: response envelope reported failure.
- `backend:response_contract`: response did not match the DTO contract.

Feature stores should preserve `origin`, `kind`, `code`, and `message` in
`StoreFailure` so `ResultBoundary` can render actionable state.

## Auth Endpoints

- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/refresh`

## Social Auth Extension

Prepared but disabled until provider keys are available.

- `GET /api/auth/oauth/{provider}/authorize`
- `POST /api/auth/oauth/{provider}/callback`

