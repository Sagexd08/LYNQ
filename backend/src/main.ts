import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS Configuration - Update CORS_ORIGIN in .env for production
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin?.split(',').map(o => o.trim()) || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/live', 'health/ready'],
  });

  const config = new DocumentBuilder()
    .setTitle('LYNQ API')
    .setDescription(`
# LYNQ - Multi-chain DeFi Lending Platform

LYNQ is a decentralized lending platform with AI-powered risk assessment.

## Features
- **Wallet Authentication**: Sign-in with your Ethereum wallet
- **AI Credit Scoring**: ML-powered risk assessment
- **Multi-chain Support**: Ethereum, Polygon, and more
- **Smart Contracts**: On-chain loan management
- **Real-time Notifications**: Telegram bot integration

## Authentication
Most endpoints require JWT authentication. Obtain a token through the wallet authentication flow:
1. POST /api/v1/auth/wallet/challenge
2. Sign the challenge message with your wallet
3. POST /api/v1/auth/wallet/verify with the signature
4. Use the returned JWT token in the Authorization header

## Rate Limiting
API requests are rate-limited. Default limits:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated endpoints
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'API key for service-to-service authentication',
      },
      'API-KEY',
    )
    .addTag('Authentication', 'Wallet-based authentication endpoints')
    .addTag('Loans', 'Loan management endpoints')
    .addTag('Collateral', 'Collateral management endpoints')
    .addTag('Risk', 'Risk assessment endpoints')
    .addTag('ML', 'Machine learning service endpoints')
    .addTag('Blockchain', 'Blockchain integration endpoints')
    .addTag('Telegram', 'Telegram bot integration')
    .addTag('Health', 'System health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'LYNQ API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 LYNQ API running on http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  logger.log(`❤️ Health Check: http://localhost:${port}/health`);
}

bootstrap();
