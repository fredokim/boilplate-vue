import { describe, expect, it } from "vitest";
import { IsString } from "class-validator";

import { TypedApiError } from "./api-error";
import { validateDto } from "./validate-dto";

class ExampleDto {
  @IsString()
  id!: string;
}

describe("validateDto", () => {
  it("returns a typed dto when the payload matches the contract", () => {
    const dto = validateDto({ id: "user-1" }, ExampleDto);

    expect(dto).toBeInstanceOf(ExampleDto);
    expect(dto.id).toBe("user-1");
  });

  it("classifies contract mismatches as backend response errors", () => {
    expect(() => validateDto({ id: 1 }, ExampleDto)).toThrow(TypedApiError);

    try {
      validateDto({ id: 1 }, ExampleDto);
    } catch (error) {
      expect(error).toBeInstanceOf(TypedApiError);
      if (error instanceof TypedApiError) {
        expect(error.origin).toBe("backend");
        expect(error.kind).toBe("response_contract");
      }
    }
  });
});

