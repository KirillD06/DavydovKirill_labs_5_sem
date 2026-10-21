import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class PublishSoilTypeDto {
  @ApiProperty({ example: 'Крупнообломочный грунт с песчаным заполнителем', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: 1.18, minimum: 1, maximum: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(2)
  looseningFactor: number;

  @ApiProperty({ example: 1.95, minimum: 0.5, maximum: 3 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(3)
  density: number;
}
