import { IsEmail, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UpdateUserRequestDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;
}


export class GetUserRequestDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class DeleteUserRequestDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class ListUsersRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @Type(() => Number)
  @IsInt()
  page: number;

  @Type(() => Number)
  @IsInt()
  limit: number;
}

