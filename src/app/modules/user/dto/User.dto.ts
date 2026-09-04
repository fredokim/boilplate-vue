import "reflect-metadata";
import { IsEmail, IsEnum, IsString } from "class-validator";

export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  Member = "member",
}

export class UserDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  roles: UserRole[];
}

