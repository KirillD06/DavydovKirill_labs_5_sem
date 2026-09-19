import { Module } from '@nestjs/common';
import { SoilTypesModule } from './soil_types/soil_types.module';

@Module({
  imports: [SoilTypesModule],
})
export class AppModule {}
