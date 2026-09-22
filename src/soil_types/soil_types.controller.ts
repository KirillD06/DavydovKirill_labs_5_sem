import { Body, Controller, Get, Param, Post, Query, Redirect, Render } from '@nestjs/common';
import { SoilType } from '../entities/soil-type.entity';
import { SoilTypesService } from './soil_types.service';

export const MIN_LOOSENING = 1.1;
export const MAX_LOOSENING = 1.5;

const DEFAULT_IMAGE = '/default.jpg';
const DEFAULT_VIDEO = '/default.mp4';

@Controller('soil_types')
export class SoilTypesController {
  constructor(private readonly soilTypesService: SoilTypesService) {}

  @Get()
  @Render('catalog')
  async catalog(@Query('maxLoosening') maxLoosening?: string) {
    const limit = maxLoosening ? Number(maxLoosening) : MAX_LOOSENING;
    const soilTypes = await this.soilTypesService.findPublished(limit);

    return {
      maxLoosening: limit.toFixed(2),
      maxLooseningLabel: limit.toFixed(2).replace('.', ','),
      rangeFrom: MIN_LOOSENING,
      rangeTo: MAX_LOOSENING,
      isCatalog: true,
      soilTypes: soilTypes.map((soilType) => this.withMedia(soilType)),
    };
  }

  @Get('draft')
  @Render('draft')
  async draft() {
    const soilType = await this.soilTypesService.findDraft();

    return {
      isDraft: true,
      soilType: soilType ? this.withMedia(soilType) : undefined,
    };
  }

  @Get('feed')
  @Render('feed')
  async feedStart() {
    const soilType = await this.soilTypesService.findFirst();

    return this.buildFeed(soilType);
  }

  @Get('feed/:id')
  @Render('feed')
  async feed(@Param('id') id: string, @Query('next') next?: string) {
    const soilType =
      next === 'true'
        ? await this.soilTypesService.findNext(Number(id))
        : await this.soilTypesService.findById(Number(id));

    return this.buildFeed(soilType);
  }

  @Post('create')
  @Redirect('/soil_types/draft', 302)
  async create(@Body('name') name: string) {
    await this.soilTypesService.createDraft(name ?? '', '', '');
  }

  @Post('publish')
  @Redirect('/soil_types', 302)
  async publish(
    @Body('id') id: string,
    @Body('shortDescription') shortDescription: string,
    @Body('looseningFactor') looseningFactor: string,
    @Body('density') density: string,
  ) {
    await this.soilTypesService.publish(
      Number(id),
      shortDescription ?? '',
      Number(looseningFactor.replace(',', '.')),
      Number(density.replace(',', '.')),
    );
  }

  @Post('delete')
  @Redirect('/soil_types', 302)
  async delete(@Body('id') id: string) {
    await this.soilTypesService.softDelete(Number(id));
  }

  private buildFeed(soilType: SoilType | null) {
    return {
      isFeed: true,
      soilType: soilType ? this.withMedia(soilType) : undefined,
    };
  }

  private withMedia(soilType: SoilType) {
    return {
      ...soilType,
      imageUrl: soilType.imageUrl || DEFAULT_IMAGE,
      videoUrl: soilType.videoUrl || DEFAULT_VIDEO,
    };
  }
}
