import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import hbs from 'hbs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  hbs.registerPartials(join(__dirname, '..', 'views', 'partials'));
  hbs.registerHelper('num2', (value: number | string) =>
    Number(value).toFixed(2).replace('.', ','),
  );
  app.setViewEngine('hbs');

  app.use(require('express').urlencoded({ extended: true }));

  await app.listen(3000);
}
bootstrap();
