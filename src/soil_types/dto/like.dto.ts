import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class LikeDto {
  @ApiProperty({ enum: [0, 1], example: 1 })
  @Type(() => Number)
  @IsIn([0, 1])
  value: number;
}
