import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getCurrentUserId } from '../current-user';
import { Like } from '../entities/like.entity';
import { SoilType } from '../entities/soil-type.entity';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class SoilTypesService {
  constructor(
    @InjectRepository(SoilType)
    private readonly soilTypeRepository: Repository<SoilType>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    private readonly minioService: MinioService,
  ) {}

  private withLikes() {
    return this.soilTypeRepository
      .createQueryBuilder('soilType')
      .addSelect(
        `(SELECT COUNT(*) FROM likes WHERE likes."soilTypeId" = soilType.id)`,
        'likesCount',
      )
      .addSelect(
        `(SELECT COUNT(*) FROM likes WHERE likes."soilTypeId" = soilType.id AND likes."userId" = :userId)`,
        'isLiked',
      )
      .setParameter('userId', getCurrentUserId());
  }

  private async fetchAll(query: SelectQueryBuilder<SoilType>): Promise<SoilType[]> {
    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((soilType, index) => {
      soilType.likesCount = Number(raw[index].likesCount);
      soilType.isLiked = Number(raw[index].isLiked) > 0 ? 1 : 0;

      return soilType;
    });
  }

  private async fetchOne(query: SelectQueryBuilder<SoilType>): Promise<SoilType | null> {
    const [soilType] = await this.fetchAll(query.limit(1));

    return soilType ?? null;
  }

  async findPublished(maxLoosening?: number): Promise<SoilType[]> {
    const query = this.withLikes()
      .where('soilType.status = :status', { status: 'published' })
      .orderBy('soilType.id', 'ASC');

    if (maxLoosening !== undefined) {
      query.andWhere('soilType.looseningFactor <= :maxLoosening', { maxLoosening });
    }

    return this.fetchAll(query);
  }

  async findById(id: number): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikes()
        .where('soilType.id = :id', { id })
        .andWhere('soilType.status = :status', { status: 'published' }),
    );
  }

  async findFirst(): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikes()
        .where('soilType.status = :status', { status: 'published' })
        .orderBy('soilType.id', 'ASC'),
    );
  }

  async findNext(id: number): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikes()
        .where('soilType.status = :status', { status: 'published' })
        .orderBy('soilType.id > :id', 'DESC')
        .addOrderBy('soilType.id', 'ASC')
        .setParameter('id', id),
    );
  }

  async findDraft(): Promise<SoilType | null> {
    return this.fetchOne(
      this.withLikes()
        .where('soilType.status = :status', { status: 'draft' })
        .andWhere('soilType.creatorId = :creatorId', { creatorId: getCurrentUserId() }),
    );
  }

  async createDraft(
    name: string,
    image?: Express.Multer.File,
    video?: Express.Multer.File,
  ): Promise<SoilType> {
    if (await this.findDraft()) {
      throw new BadRequestException('У пользователя уже есть черновик');
    }

    const draft = this.soilTypeRepository.create({
      name,
      imageUrl: image ? await this.minioService.upload(image, 'soil-type-image') : '',
      videoUrl: video ? await this.minioService.upload(video, 'soil-type-video') : '',
      status: 'draft',
      creatorId: getCurrentUserId(),
    });

    await this.soilTypeRepository.save(draft);

    return (await this.findDraft())!;
  }

  async publish(
    id: number,
    description: string,
    looseningFactor: number,
    density: number,
  ): Promise<SoilType> {
    const draft = await this.findDraft();

    if (!draft || draft.id !== id) {
      throw new NotFoundException('Черновик не найден');
    }

    await this.soilTypeRepository.update(
      { id },
      { description, looseningFactor, density, status: 'published', formedAt: () => 'CURRENT_TIMESTAMP' },
    );

    return (await this.findById(id))!;
  }

  async softDelete(id: number): Promise<void> {
    const soilType = await this.soilTypeRepository.findOneBy({ id });

    if (!soilType || soilType.status === 'deleted') {
      throw new NotFoundException('Тип грунта не найден');
    }
    if (soilType.creatorId !== getCurrentUserId()) {
      throw new ForbiddenException('Удалять можно только свои типы грунта');
    }

    await this.soilTypeRepository.update({ id }, { status: 'deleted' });
  }

  async setLike(id: number, value: number): Promise<SoilType> {
    const soilType = await this.findById(id);

    if (!soilType) {
      throw new NotFoundException('Тип грунта не найден');
    }

    const like = { userId: getCurrentUserId(), soilTypeId: id };
    const exists = await this.likeRepository.existsBy(like);

    if (value === 1 && !exists) {
      await this.likeRepository.save(this.likeRepository.create(like));
    }
    if (value === 0 && exists) {
      await this.likeRepository.delete(like);
    }

    return (await this.findById(id))!;
  }
}
