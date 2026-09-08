import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import { MEDIA_URL } from './soils.data';
import { SoilsService } from './soils.service';

@Controller('soils')
export class SoilsController {
  constructor(private readonly soilsService: SoilsService) {}

  @Get()
  @Render('catalog')
  catalog(@Query('maxLoosening') maxLoosening?: string) {
    const limit = maxLoosening ? Number(maxLoosening.replace(',', '.')) : undefined;

    return {
      mediaUrl: MEDIA_URL,
      maxLoosening: maxLoosening ?? '',
      isCatalog: true,
      soils: this.soilsService.findPublished(limit),
    };
  }

  @Get('draft')
  @Render('draft')
  draft() {
    return {
      mediaUrl: MEDIA_URL,
      isDraft: true,
      soil: this.soilsService.findDraft(),
    };
  }

  @Get('feed')
  @Render('feed')
  feedStart() {
    return {
      mediaUrl: MEDIA_URL,
      isFeed: true,
      soil: this.soilsService.findPublished()[0],
    };
  }

  @Get('feed/:id')
  @Render('feed')
  feed(@Param('id') id: string, @Query('next') next?: string) {
    const soil =
      next === 'true'
        ? this.soilsService.findNext(Number(id))
        : this.soilsService.findById(Number(id));

    return { mediaUrl: MEDIA_URL, isFeed: true, soil };
  }
}
