import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { initCrypto } from './utils/crypto';
import { initLogger } from './utils/logger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  
  // Initialize crypto keys and logger from config
  initCrypto(configService);
  initLogger(configService);

  // Security
  app.use(helmet());

  // CORS
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  const adminUrl = configService.get<string>('ADMIN_URL', 'http://localhost:3002');
  
  app.enableCors({
    origin: [frontendUrl, adminUrl],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('LYNQ API')
    .setDescription('Multi-Chain DeFi Lending Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 LYNQ Backend running on http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health Check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
