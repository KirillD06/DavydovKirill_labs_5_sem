import { Injectable } from '@nestjs/common';
import { Soil, SOILS } from './soils.data';

@Injectable()
export class SoilsService {
  private readonly soils: Soil[] = SOILS;

  findPublished(maxLoosening?: number): Soil[] {
    const published = this.soils.filter((soil) => soil.status === 'published');

    if (maxLoosening === undefined) {
      return published;
    }

    return published.filter((soil) => soil.looseningFactor <= maxLoosening);
  }

  findById(id: number): Soil | undefined {
    return this.soils.find((soil) => soil.id === id && soil.status !== 'deleted');
  }

  findNext(id: number): Soil | undefined {
    const published = this.findPublished();
    const current = published.findIndex((soil) => soil.id === id);

    return published[(current + 1) % published.length];
  }

  findDraft(): Soil | undefined {
    return this.soils.find((soil) => soil.status === 'draft');
  }
}
