import { Module } from '@nestjs/common';
import { SoilTypesController } from './soil_types.controller';
import { SoilTypesService } from './soil_types.service';

@Module({
  controllers: [SoilTypesController],
  providers: [SoilTypesService],
})
export class SoilTypesModule {}
