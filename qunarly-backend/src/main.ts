import { Logger, UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import * as express from 'express';
import * as path from 'path';
import { NextFunction, Request, Response } from 'express';

const safeDbFingerprint = (databaseUrl?: string) => {
  if (!databaseUrl) {
    return 'DB: missing DATABASE_URL';
  }
  try {
    const url = new URL(databaseUrl);
    const schema = url.searchParams.get('schema') || 'public';
    const host = url.hostname || 'unknown';
    const port = url.port || '5432';
    const db = url.pathname.replace(/^\//, '') || 'unknown';
    return `DB: host=${host} port=${port} db=${db} schema=${schema}`;
  } catch (error) {
    return 'DB: invalid DATABASE_URL';
  }
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bootstrapLogger = new Logger('Bootstrap');
  bootstrapLogger.log(safeDbFingerprint(process.env.DATABASE_URL));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const logger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  });
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          message: 'Validation failed',
          errors: errors.map((error) => ({
            field: error.property,
            constraints: error.constraints,
          })),
        }),
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Qunarly API')
    .setDescription('Qunarly Agritech Platform MVP')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  document.security = [{ bearerAuth: [] }];
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  bootstrapLogger.log(`Application is running on: http://0.0.0.0:${port}`);
}

bootstrap();
