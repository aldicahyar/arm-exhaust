import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`ARM Exhaust NestJS Backend berjalan di http://localhost:${port}/api`);
}

bootstrap();
