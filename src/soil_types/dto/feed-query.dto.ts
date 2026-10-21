import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class SoilTypesQueryDto {
  @ApiPropertyOptional({ example: 1.2, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxLoosening?: number;
}

export class FeedQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Без id — первый опубликованный тип грунта' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'true — следующий после id по кругу' })
  @IsOptional()
  @IsIn(['true', 'false'])
  next?: string;
}
