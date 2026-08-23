import { z } from "zod";

import type { InferDto } from "@core/dto/infer-dto";
import type { UserDto } from "../dto/User.dto";
import { UserRole } from "../dto/User.dto";

export const userStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.email(),
  roles: z.array(z.enum(UserRole)),
}) satisfies z.ZodType<InferDto<typeof UserDto>>;

export const userStoreSnapshotSchema = z.object({
  user: userStateSchema.nullable(),
  status: z.enum(["idle", "loading", "success", "error"]),
});

export type UserState = z.infer<typeof userStateSchema>;
export type UserStoreSnapshot = z.infer<typeof userStoreSnapshotSchema>;
