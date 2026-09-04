import "reflect-metadata";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from "class-validator";

/** One stored message, as the backend publishes it. */
export class ChatMessageResponseDto {
  @IsString()
  id!: string;

  @IsString()
  clientMessageId!: string;

  @IsString()
  broadcastId!: string;

  @IsInt()
  sequence!: number;

  @IsString()
  authorId!: string;

  @IsString()
  displayName!: string;

  @IsString()
  body!: string;

  @IsString()
  sentAt!: string;

  @IsBoolean()
  deleted!: boolean;
}

/** One page of history. `nextCursor` is null once the page reached the end. */
export class ChatHistoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageResponseDto)
  messages!: ChatMessageResponseDto[];

  @IsInt()
  @IsOptional()
  nextCursor!: number | null;

  @IsInt()
  latestSequence!: number;
}
