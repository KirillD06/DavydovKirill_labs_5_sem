import { Module } from '@nestjs/common';
import { SoilsModule } from './soils/soils.module';

@Module({
  imports: [SoilsModule],
})
export class AppModule {}
