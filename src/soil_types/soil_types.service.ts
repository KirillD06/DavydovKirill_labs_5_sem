import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SoilType } from '../entities/soil-type.entity';

export const CURRENT_USER_ID = 1;

@Injectable()
export class SoilTypesService {
  constructor(
    @InjectRepository(SoilType)
    private readonly soilTypeRepository: Repository<SoilType>,
  ) {}

  private withLikesCount() {
    return this.soilTypeRepository
      .createQueryBuilder('soilType')
      .addSelect(
        `(SELECT COUNT(*) FROM likes WHERE likes."soilTypeId" = soilType.id)`,
        'likesCount',
      );
  }

  private async fetchAll(query: SelectQueryBuilder<SoilType>): Promise<SoilType[]> {
    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((soilType, index) => {
      soilType.likesCount = Number(raw[index].likesCount);

      return soilType;
    });
  }

  private async fetchOne(query: SelectQueryBuilder<SoilType>): Promise<SoilType | null> {
    const [soilType] = await this.fetchAll(query.limit(1));

    return soilType ?? null;
  }

  async findPublished(maxLoosening?: number): Promise<SoilType[]> {
    const query = this.withLikesCount()
      .where('soilType.status = :status', { status: 'published' })
      .orderBy('soilType.id', 'ASC');

    if (maxLoosening !== undefined) {
      query.andWhere('soilType.looseningFactor <= :maxLoosening', { maxLoosening });
    }

    return this.fetchAll(query);
  }

  async findById(id: number): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikesCount()
        .where('soilType.id = :id', { id })
        .andWhere('soilType.status != :deleted', { deleted: 'deleted' }),
    );
  }

  async findFirst(): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikesCount()
        .where('soilType.status = :status', { status: 'published' })
        .orderBy('soilType.id', 'ASC'),
    );
  }

  async findNext(id: number): Promise<SoilType | null> {
    const next = await this.fetchOne(
      this.withLikesCount()
        .where('soilType.status = :status', { status: 'published' })
        .andWhere('soilType.id > :id', { id })
        .orderBy('soilType.id', 'ASC'),
    );

    return next ?? this.findFirst();
  }

  async findDraft(): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikesCount()
        .where('soilType.status = :status', { status: 'draft' })
        .andWhere('soilType.creatorId = :creatorId', { creatorId: CURRENT_USER_ID }),
    );
  }

  async createDraft(name: string, imageUrl: string, videoUrl: string): Promise<SoilType> {
    const draft = this.soilTypeRepository.create({
      name,
      imageUrl,
      videoUrl,
      status: 'draft',
      creatorId: CURRENT_USER_ID,
    });

    return this.soilTypeRepository.save(draft);
  }

  async publish(
    id: number,
    shortDescription: string,
    looseningFactor: number,
    density: number,
  ): Promise<void> {
    await this.soilTypeRepository.update(
      { id },
      { shortDescription, looseningFactor, density, status: 'published', formedAt: new Date() },
    );
  }

  async softDelete(id: number): Promise<void> {
    await this.soilTypeRepository.query(
      `UPDATE soil_types SET status = 'deleted' WHERE id = $1`,
      [id],
    );
  }
}
