import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class PublishSoilTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(2)
  looseningFactor: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(3)
  density: number;
}
