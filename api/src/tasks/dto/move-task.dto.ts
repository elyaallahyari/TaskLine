import { IsArray, IsString } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  columnId: string;

  @IsArray()
  @IsString({ each: true })
  orderedTaskIds: string[];
}
