import { SoilType } from '../../entities/soil-type.entity';

export class SoilTypeResponseDto {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  looseningFactor: number | null;
  density: number | null;
  likesCount: number;
  isLiked: number;
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
