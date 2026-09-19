import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { MEDIA_URL, SoilType } from './soil_types.data';
import { SoilTypesService } from './soil_types.service';

export const MIN_LOOSENING = 1.1;
export const MAX_LOOSENING = 1.5;

@Controller('soil_types')
export class SoilTypesController {
  constructor(private readonly soilTypesService: SoilTypesService) {}

  @Get()
  @Render('catalog')
  catalog(@Query('maxLoosening') maxLoosening?: string) {
    const limit = maxLoosening ? Number(maxLoosening) : MAX_LOOSENING;

    const soilTypes = this.soilTypesService
      .findPublished(limit)
      .map((soilType) => this.withLikesCount(soilType));

    return {
      mediaUrl: MEDIA_URL,
      maxLoosening: limit.toFixed(2),
      maxLooseningLabel: limit.toFixed(2).replace('.', ','),
      rangeFrom: MIN_LOOSENING,
      rangeTo: MAX_LOOSENING,
      isCatalog: true,
      soilTypes,
    };
  }

  @Get('draft')
  @Render('draft')
  draft() {
    return {
      mediaUrl: MEDIA_URL,
      isDraft: true,
      soilType: this.soilTypesService.findDraft(),
    };
  }

  @Get('feed')
  @Render('feed')
  feedStart() {
    const soilType = this.soilTypesService.findPublished()[0];

    return this.buildFeed(soilType);
  }

  @Get('feed/:id')
  @Render('feed')
  feed(@Param('id') id: string, @Query('next') next?: string) {
    const soilType =
      next === 'true'
        ? this.soilTypesService.findNext(Number(id))
        : this.soilTypesService.findById(Number(id));

    return this.buildFeed(soilType);
  }

  private buildFeed(soilType?: SoilType) {
    return {
      mediaUrl: MEDIA_URL,
      isFeed: true,
      soilType: soilType ? this.withLikesCount(soilType) : undefined,
    };
  }

  private withLikesCount(soilType: SoilType) {
    return { ...soilType, likesCount: this.soilTypesService.countLikes(soilType) };
  }
}
