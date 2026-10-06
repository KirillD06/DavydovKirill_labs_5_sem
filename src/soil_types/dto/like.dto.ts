import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class LikeDto {
  @Type(() => Number)
  @IsIn([0, 1])
  value: number;
}
