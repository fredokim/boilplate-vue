import { describe, expect, it } from "vitest";

import type { InferDto } from "@core/dto/infer-dto";
import type { LoginRequestDto } from "../dto/Auth.dto";
import { loginSchema, type LoginInput } from "./login.schema";

describe("loginSchema", () => {
  it("returns input typed from the request DTO contract", () => {
    const result: InferDto<typeof LoginRequestDto> = loginSchema.parse({
      email: "admin@example.com",
      password: "password",
    });

    expect(result.email).toBe("admin@example.com");
  });

  it("rejects invalid form values with field-level messages", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "short",
    } satisfies LoginInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Enter a valid email.");
      expect(result.error.flatten().fieldErrors.password?.[0]).toBe("Password must be at least 8 characters.");
    }
  });
});
