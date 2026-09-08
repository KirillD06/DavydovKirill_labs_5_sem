import { Module } from '@nestjs/common';
import { SoilsController } from './soils.controller';
import { SoilsService } from './soils.service';

@Module({
  controllers: [SoilsController],
  providers: [SoilsService],
})
export class SoilsModule {}
