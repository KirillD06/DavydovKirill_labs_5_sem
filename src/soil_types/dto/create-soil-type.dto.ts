import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSoilTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
