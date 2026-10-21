import { ApiProperty } from '@nestjs/swagger';
import { SoilType } from '../../entities/soil-type.entity';

export class SoilTypeResponseDto {
  @ApiProperty({})
  id: number;
  @ApiProperty({})
  name: string;
  @ApiProperty({ nullable: true, type: String })
  description: string | null;
  @ApiProperty({ nullable: true, type: String })
  imageUrl: string | null;
  @ApiProperty({ nullable: true, type: String })
  videoUrl: string | null;
  @ApiProperty({ nullable: true, type: Number })
  looseningFactor: number | null;
  @ApiProperty({ nullable: true, type: Number })
  density: number | null;
  @ApiProperty({})
  likesCount: number;
  @ApiProperty({ enum: [0, 1] })
  isLiked: number;
  @ApiProperty({ enum: [0, 1] })
  isMine: number;

  static fromEntity(soilType: SoilType, currentUserId: number): SoilTypeResponseDto {
    return {
      id: soilType.id,
      name: soilType.name,
      description: soilType.description,
      imageUrl: soilType.imageUrl || null,
      videoUrl: soilType.videoUrl || null,
      looseningFactor: soilType.looseningFactor === null ? null : Number(soilType.looseningFactor),
      density: soilType.density === null ? null : Number(soilType.density),
      likesCount: soilType.likesCount,
      isLiked: soilType.isLiked,
      isMine: soilType.creatorId === currentUserId ? 1 : 0,
    };
  }
}
