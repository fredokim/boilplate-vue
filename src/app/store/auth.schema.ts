import { z } from "zod";

import type { InferDto } from "@core/dto/infer-dto";
import type { AuthSessionDto, AuthUserDto } from "@modules/auth/dto/Auth.dto";

export const authUserStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  roles: z.array(z.string()),
}) satisfies z.ZodType<InferDto<typeof AuthUserDto>>;

export const authSessionStateSchema = z.object({
  user: authUserStateSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
}) satisfies z.ZodType<InferDto<typeof AuthSessionDto>>;

export const authStateSnapshotSchema = z.object({
  user: authUserStateSchema.nullable(),
  accessToken: z.string().min(1).nullable(),
  status: z.enum(["idle", "loading", "success", "error"]),
  sessionChecked: z.boolean(),
});

export type AuthUserState = z.infer<typeof authUserStateSchema>;
export type AuthSessionState = z.infer<typeof authSessionStateSchema>;
export type AuthStateSnapshot = z.infer<typeof authStateSnapshotSchema>;
