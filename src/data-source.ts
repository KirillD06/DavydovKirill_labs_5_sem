import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Like } from './entities/like.entity';
import { SoilType } from './entities/soil-type.entity';
import { User } from './entities/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [SoilType, User, Like],
  migrations: ['src/migrations/*.ts'],
});
