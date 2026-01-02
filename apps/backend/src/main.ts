import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const configService = app.get(ConfigService);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');
    const port = configService.get<number>('PORT', 3000);
    const allowedOrigins = Array.from(
        new Set(
            [
                configService.get<string>('FRONTEND_URL'),
                configService.get<string>('ADMIN_URL'),
                ...(configService.get<string>('CORS_ORIGINS')?.split(',').map((origin) => origin.trim()) || []),
                'http:
                'http:
                'http:
            ].filter(Boolean),
        ),
    );
    app.useLogger(nodeEnv === 'production' ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose']);
    app.use(helmet());
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    const enableSwagger = configService.get<string>('ENABLE_SWAGGER');
    const shouldServeSwagger = enableSwagger ? enableSwagger !== 'false' : nodeEnv !== 'production';
    if (shouldServeSwagger) {
        const config = new DocumentBuilder()
            .setTitle('LYNQ API')
            .setDescription('Multi-Chain DeFi Lending Platform - Rebuilt Backend')
            .setVersion('2.0.0')
            .addBearerAuth()
            .addTag('Auth', 'Authentication endpoints')
            .addTag('Users', 'User management')
            .addTag('Loans', 'Loan operations')
            .addTag('Telegram', 'Telegram notifications')
            .addTag('Health', 'System health')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }
    app.enableShutdownHooks();
    await app.listen(port);
    logger.log(`🚀 LYNQ Backend v2.0 running on http:
    if (shouldServeSwagger) {
        logger.log(`📚 API Documentation: http:
    }
    logger.log(`❤️  Health Check: http:
}
bootstrap();
