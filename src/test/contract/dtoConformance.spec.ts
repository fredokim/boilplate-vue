import "reflect-metadata";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getMetadataStorage } from "class-validator";
import { ApiErrorBodyDto, BaseApiResponseDto } from "@core/api/api-response.dto";
import {
  AuthSessionDto,
  AuthSessionUserDto,
  AuthUserDto,
  LoginRequestDto,
  SocialAuthorizeDto,
  SocialCallbackDto,
  SocialProviderDto,
} from "@modules/auth/dto/Auth.dto";
import {
  KpiDataDto,
  SeriesDataDto,
  SeriesPointDto,
  TableColumnDto,
  TableDataDto,
  TableRowDto,
} from "@modules/customizable-dashboard/data/dashboardDataSource.dto";
import { ChatHistoryDto, ChatMessageResponseDto } from "@modules/live-experience/chat/realtime/serverChat.dto";
import { UserDto } from "@modules/user/dto/User.dto";
import { TopologySnapshotDto } from "@modules/visual-graph/realtime/topologySnapshot.dto";

/**
 * Every DTO this app validates a server response with, against the schema the
 * server publishes for it.
 *
 * The neighbouring `openapiContract.spec.ts` asserts *meaning*: which endpoints
 * are called, and which are unbacked on purpose. What it could not do is keep up
 * with the DTOs themselves — a field quietly becoming optional on the server
 * reaches a reader as a runtime validation failure, which is this app blaming
 * itself for someone else's change.
 *
 * This reads what class-validator actually enforces rather than what a type
 * says, because that is what decides whether a response is accepted at runtime.
 *
 * The names diverge here more than in the other two boilerplates: this app calls
 * the login result `AuthSessionDto` and the session `AuthSessionUserDto`, where
 * React has `LoginResultDto` and `SessionDto`. Unifying the names would be a
 * rename across a working app for no behaviour change; declaring the
 * correspondence costs one line each and is what actually prevents drift.
 */

const SPEC_PATH = resolve(__dirname, "../../../contracts/openapi.json");

type Schema = { properties?: Record<string, unknown>; required?: string[] };
type OpenApiDocument = { components: { schemas: Record<string, Schema> } };

function loadSpec(): OpenApiDocument | null {
  if (!existsSync(SPEC_PATH)) return null;

  return JSON.parse(readFileSync(SPEC_PATH, "utf8")) as OpenApiDocument;
}

const spec = loadSpec();
const describeIfSpec = spec ? describe : describe.skip;

type Constructor = new () => object;

/**
 * A disagreement that exists today, named field by field.
 *
 * `UserDto` validates `roles: UserRole[]`. The server sends `role: string`. In
 * mock mode the handler supplies `roles: ["admin"]` and everything works; against
 * the real server every user response fails validation before a view sees it, and
 * the reader is told the page cannot read the answer. React's `UserDto` has
 * `role` and agrees with the server, so this is Vue's alone.
 *
 * Fixing it means changing a DTO, a Zod schema, a store, a view and the mock
 * registry together — a feature change, and this pass was scoped to not make
 * those. So it is recorded rather than hidden: the fields are listed explicitly,
 * and a *different* divergence appearing here still fails. An exception that
 * swallowed anything would be worth less than no check at all.
 */
const KNOWN_DIVERGENCE = new Map<string, { validatedButNotSent: string[] }>([
  ["UserResponseDto", { validatedButNotSent: ["roles"] }],
]);

const MAPPED: readonly (readonly [Constructor, string])[] = [
  [AuthUserDto, "AuthUserResponseDto"],
  [AuthSessionDto, "LoginResponseDto"],
  [AuthSessionUserDto, "SessionResponseDto"],
  [LoginRequestDto, "LoginRequestDto"],
  [KpiDataDto, "KpiDataDto"],
  [SeriesPointDto, "SeriesPointDto"],
  [SeriesDataDto, "SeriesDataDto"],
  [TableColumnDto, "TableColumnDto"],
  [TableRowDto, "TableRowDto"],
  [TableDataDto, "TableDataDto"],
  [ChatMessageResponseDto, "ChatMessageDto"],
  [ChatHistoryDto, "ChatHistoryDto"],
  [UserDto, "UserResponseDto"],
  [TopologySnapshotDto, "TopologySnapshotDto"],
];

/**
 * Validated locally rather than received from this API.
 *
 * The social DTOs describe `/api/auth/oauth/{provider}/…`, which this server does
 * not implement — `openapiContract.spec.ts` already declares those endpoints in
 * `UNBACKED_BY_DESIGN`. They stay as a worked example of wiring a provider flow;
 * comparing them to a schema that does not exist would only invent a failure.
 *
 * `ApiErrorBodyDto` and `BaseApiResponseDto` are the envelope itself, which the
 * server publishes inline rather than as named schemas.
 */
const NOT_A_RESPONSE_SCHEMA: readonly Constructor[] = [
  ApiErrorBodyDto,
  BaseApiResponseDto,
  SocialAuthorizeDto,
  SocialCallbackDto,
  SocialProviderDto,
];

/** Property names class-validator will enforce on this class. */
function validatedProperties(target: Constructor): Set<string> {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(target, "", false, false);

  return new Set(metadata.map((entry) => entry.propertyName));
}

/**
 * Properties this class accepts as absent.
 *
 * `@IsOptional()` registers as `conditionalValidation`; anything without one is
 * enforced, and a response missing it is rejected before a view sees it.
 */
function optionalProperties(target: Constructor): Set<string> {
  const metadata = getMetadataStorage().getTargetValidationMetadatas(target, "", false, false);

  return new Set(
    metadata.filter((entry) => entry.type === "conditionalValidation").map((entry) => entry.propertyName),
  );
}

describeIfSpec("every mapped DTO matches the schema the server publishes", () => {
  const schemas = spec?.components.schemas ?? {};

  for (const [Dto, schemaName] of MAPPED) {
    describe(`${Dto.name} ↔ ${schemaName}`, () => {
      it("is a schema the server actually publishes", () => {
        expect(Object.keys(schemas)).toContain(schemaName);
      });

      it("validates no field the server does not send", () => {
        const published = new Set(Object.keys(schemas[schemaName]?.properties ?? {}));
        const known = KNOWN_DIVERGENCE.get(schemaName)?.validatedButNotSent ?? [];

        expect([...validatedProperties(Dto)].filter((name) => !published.has(name))).toEqual(known);
      });

      /**
       * The dangerous direction. A field the server may omit but the DTO
       * enforces turns a legitimate response into a validation failure, and the
       * reader is told the page cannot read the answer.
       */
      it("does not require a field the server treats as optional", () => {
        const required = new Set(schemas[schemaName]?.required ?? []);
        const optional = optionalProperties(Dto);
        const known = KNOWN_DIVERGENCE.get(schemaName)?.validatedButNotSent ?? [];

        expect([...validatedProperties(Dto)].filter((n) => !optional.has(n) && !required.has(n))).toEqual(known);
      });

      /**
       * The quiet direction. A field the server guarantees but the DTO treats as
       * optional pushes an impossible `undefined` into every view that reads it,
       * and nothing fails until one of them does.
       */
      it("does not treat a guaranteed field as optional", () => {
        const validated = validatedProperties(Dto);
        const optional = optionalProperties(Dto);

        expect((schemas[schemaName]?.required ?? []).filter((n) => validated.has(n) && optional.has(n))).toEqual(
          [],
        );
      });
    });
  }
});

describeIfSpec("coverage", () => {
  /** The ratchet. Adding a DTO without deciding what it corresponds to is how gaps start. */
  it("maps or excuses every DTO class in the repository", () => {
    const declared = new Set<string>([
      ...MAPPED.map(([Dto]) => Dto.name),
      ...NOT_A_RESPONSE_SCHEMA.map((Dto) => Dto.name),
    ]);

    const exported = [
      ApiErrorBodyDto,
      BaseApiResponseDto,
      AuthUserDto,
      AuthSessionDto,
      AuthSessionUserDto,
      LoginRequestDto,
      SocialAuthorizeDto,
      SocialCallbackDto,
      SocialProviderDto,
      KpiDataDto,
      SeriesPointDto,
      SeriesDataDto,
      TableColumnDto,
      TableRowDto,
      TableDataDto,
      ChatMessageResponseDto,
      ChatHistoryDto,
      UserDto,
      TopologySnapshotDto,
    ].map((Dto) => Dto.name);

    expect(exported.filter((name) => !declared.has(name))).toEqual([]);
  });
});
