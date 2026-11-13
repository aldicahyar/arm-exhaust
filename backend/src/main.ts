import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Pasang global prefix /api
  app.setGlobalPrefix('api');

  // Pasang cookie-parser middleware
  app.use(cookieParser());

  // Pasang validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Static assets serving untuk public/uploads pada prefix /uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`ARM Exhaust NestJS Backend berjalan di http://localhost:${port}/api`);
}

void bootstrap();
