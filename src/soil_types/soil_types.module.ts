import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../entities/like.entity';
import { SoilType } from '../entities/soil-type.entity';
import { User } from '../entities/user.entity';
import { SoilTypesController } from './soil_types.controller';
import { SoilTypesService } from './soil_types.service';

@Module({
  imports: [TypeOrmModule.forFeature([SoilType, User, Like])],
  controllers: [SoilTypesController],
  providers: [SoilTypesService],
})
export class SoilTypesModule {}
