import { Injectable } from '@nestjs/common';
import { SoilType, SOIL_TYPES } from './soil_types.data';

@Injectable()
export class SoilTypesService {
  private readonly soilTypes: SoilType[] = SOIL_TYPES;

  findPublished(maxLoosening?: number): SoilType[] {
    const published = this.soilTypes.filter((soilType) => soilType.status === 'published');

    if (maxLoosening === undefined) {
      return published;
    }

    return published.filter((soilType) => soilType.looseningFactor <= maxLoosening);
  }

  findById(id: number): SoilType | undefined {
    return this.soilTypes.find(
      (soilType) => soilType.id === id && soilType.status !== 'deleted',
    );
  }

  findNext(id: number): SoilType | undefined {
    const published = this.findPublished();
    const current = published.findIndex((soilType) => soilType.id === id);

    return published[(current + 1) % published.length];
  }

  findDraft(): SoilType | undefined {
    return this.soilTypes.find((soilType) => soilType.status === 'draft');
  }

  countLikes(soilType: SoilType): number {
    return soilType.likes.length;
  }
}
