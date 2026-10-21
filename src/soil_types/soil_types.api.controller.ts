import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { getCurrentUserId } from '../current-user';
import { SoilType } from '../entities/soil-type.entity';
import { CreateSoilTypeDto } from './dto/create-soil-type.dto';
import { LikeDto } from './dto/like.dto';
import { PublishSoilTypeDto } from './dto/publish-soil-type.dto';
import { SoilTypeResponseDto } from './dto/soil-type-response.dto';
import { SoilTypesService } from './soil_types.service';

@Controller('api/soil_types')
export class SoilTypesApiController {
  constructor(private readonly soilTypesService: SoilTypesService) {}

  @Get()
  async list(@Query('maxLoosening') maxLoosening?: string): Promise<SoilTypeResponseDto[]> {
    const soilTypes = await this.soilTypesService.findPublished(
      maxLoosening ? Number(maxLoosening) : undefined,
    );

    return soilTypes.map((soilType) => this.toResponse(soilType));
  }

  @Get('feed')
  async feed(
    @Query('id', new ParseIntPipe({ optional: true })) id?: number,
    @Query('next') next?: string,
  ): Promise<SoilTypeResponseDto> {
    const soilType = id === undefined
      ? await this.soilTypesService.findFirst()
      : next === 'true'
        ? await this.soilTypesService.findNext(id)
        : await this.soilTypesService.findById(id);

    return this.toResponseOrNotFound(soilType);
  }

  @Get('draft')
  async draft(): Promise<SoilTypeResponseDto> {
    return this.toResponseOrNotFound(await this.soilTypesService.findDraft());
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async create(
    @Body() dto: CreateSoilTypeDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ): Promise<{ id: number }> {
    const draft = await this.soilTypesService.createDraft(
      dto.name,
      files?.image?.[0],
      files?.video?.[0],
    );

    return { id: draft.id };
  }

  @Put(':id/publish')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishSoilTypeDto,
  ): Promise<SoilTypeResponseDto> {
    const soilType = await this.soilTypesService.publish(
      id,
      dto.description,
      dto.looseningFactor,
      dto.density,
    );

    return this.toResponse(soilType);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.soilTypesService.softDelete(id);
  }

  @Post(':id/like')
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeDto,
  ): Promise<SoilTypeResponseDto> {
    return this.toResponse(await this.soilTypesService.setLike(id, dto.value));
  }

  private toResponse(soilType: SoilType): SoilTypeResponseDto {
    return SoilTypeResponseDto.fromEntity(soilType, getCurrentUserId());
  }

  private toResponseOrNotFound(soilType: SoilType | null): SoilTypeResponseDto {
    if (!soilType) {
      throw new NotFoundException('Тип грунта не найден');
    }

    return this.toResponse(soilType);
  }
}
