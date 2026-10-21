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
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RequireUser } from '../session/require-user.decorator';
import type { UserRequest } from '../session/user-request';
import { FeedQueryDto, SoilTypesQueryDto } from './dto/feed-query.dto';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

class CreatedSoilTypeDto {
  @ApiProperty({ example: 8 })
  id: number;
}
import { SoilType } from '../entities/soil-type.entity';
import { CreateSoilTypeDto } from './dto/create-soil-type.dto';
import { LikeDto } from './dto/like.dto';
import { PublishSoilTypeDto } from './dto/publish-soil-type.dto';
import { SoilTypeResponseDto } from './dto/soil-type-response.dto';
import { SoilTypesService } from './soil_types.service';

@ApiTags('Типы грунта')
@ApiBadRequestResponse({ description: 'Некорректные поля или второй черновик' })
@ApiNotFoundResponse({ description: 'Тип грунта или свой черновик не найден' })
@Controller('api/soil_types')
export class SoilTypesApiController {
  constructor(private readonly soilTypesService: SoilTypesService) {}

  @Get()
  @ApiOperation({ summary: '1. Каталог типов грунта с фильтром' })
  @ApiOkResponse({ type: [SoilTypeResponseDto] })
  async list(@Query() query: SoilTypesQueryDto, @Req() request: UserRequest): Promise<SoilTypeResponseDto[]> {
    const soilTypes = await this.soilTypesService.findPublished(query.maxLoosening, request.currentUser?.id);
    return soilTypes.map((soilType) => this.toResponse(soilType, request.currentUser?.id));
  }

  @Get('feed')
  @ApiOperation({ summary: '2. Лента типов грунта', description: 'Один метод: без id — первый грунт; id — выбранный; id и next=true — следующий.' })
  @ApiOkResponse({ type: SoilTypeResponseDto })
  async feed(@Query() query: FeedQueryDto, @Req() request: UserRequest): Promise<SoilTypeResponseDto> {
    const userId = request.currentUser?.id;
    const soilType = query.id === undefined
      ? await this.soilTypesService.findFirst(userId)
      : query.next === 'true'
        ? await this.soilTypesService.findNext(query.id, userId)
        : await this.soilTypesService.findById(query.id, userId);
    return this.toResponseOrNotFound(soilType, userId);
  }

  @Get('draft')
  @RequireUser()
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({ description: 'Требуется вход' })
  @ApiOperation({ summary: '3. Черновик текущего пользователя' })
  @ApiOkResponse({ type: SoilTypeResponseDto })
  async draft(@Req() request: UserRequest): Promise<SoilTypeResponseDto> {
    return this.toResponseOrNotFound(await this.soilTypesService.findDraft(request.currentUser!.id), request.currentUser!.id);
  }

  @Post()
  @RequireUser()
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({ description: 'Требуется вход' })
  @ApiOperation({ summary: '4. Далее — создать тип грунта', description: 'Три входных поля. Фото и видео необязательны. Ответ содержит только id нового черновика.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['name'], additionalProperties: false, properties: {
    name: { type: 'string', maxLength: 100, example: 'Гравий' },
    image: { type: 'string', format: 'binary' },
    video: { type: 'string', format: 'binary' },
  } } })
  @ApiCreatedResponse({ type: CreatedSoilTypeDto })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async create(
    @Req() request: UserRequest,
    @Body() dto: CreateSoilTypeDto,
    @UploadedFiles() files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ): Promise<{ id: number }> {
    const draft = await this.soilTypesService.createDraft(
      request.currentUser!.id,
      dto.name,
      files?.image?.[0],
      files?.video?.[0],
    );

    return { id: draft.id };
  }

  @Put(':id/publish')
  @RequireUser()
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({ description: 'Требуется вход' })
  @ApiOperation({ summary: '5. Опубликовать тип грунта' })
  @ApiBody({ type: PublishSoilTypeDto })
  @ApiOkResponse({ type: SoilTypeResponseDto })
  async publish(
    @Req() request: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishSoilTypeDto,
  ): Promise<SoilTypeResponseDto> {
    const soilType = await this.soilTypesService.publish(
      request.currentUser!.id,
      id,
      dto.description,
      dto.looseningFactor,
      dto.density,
    );

    return this.toResponse(soilType, request.currentUser!.id);
  }

  @Delete(':id')
  @RequireUser()
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({ description: 'Требуется вход' })
  @ApiForbiddenResponse({ description: 'Тип грунта принадлежит другому пользователю' })
  @ApiOperation({ summary: '6. Удалить свой тип грунта' })
  @ApiNoContentResponse()
  @HttpCode(204)
  async remove(@Req() request: UserRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.soilTypesService.softDelete(id, request.currentUser!.id);
  }

  @Post(':id/like')
  @RequireUser()
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({ description: 'Требуется вход' })
  @ApiOperation({ summary: '7. Поставить или снять лайк' })
  @ApiBody({ type: LikeDto })
  @ApiCreatedResponse({ type: SoilTypeResponseDto })
  async like(
    @Req() request: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeDto,
  ): Promise<SoilTypeResponseDto> {
    return this.toResponse(await this.soilTypesService.setLike(id, dto.value, request.currentUser!.id), request.currentUser!.id);
  }

  private toResponse(soilType: SoilType, userId?: number): SoilTypeResponseDto {
    return SoilTypeResponseDto.fromEntity(soilType, userId ?? 0);
  }

  private toResponseOrNotFound(soilType: SoilType | null, userId?: number): SoilTypeResponseDto {
    if (!soilType) {
      throw new NotFoundException('Тип грунта не найден');
    }

    return this.toResponse(soilType, userId);
  }
}
