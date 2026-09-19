import { IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;
}

export class UpdateColumnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;
}

export class ReorderColumnsDto {
  @IsArray()
  @IsString({ each: true })
  columnIds: string[];
}
