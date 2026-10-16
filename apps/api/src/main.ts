import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Crypto Analysis Platform API')
    .setDescription('REST + WebSocket API for crypto analysis, patterns, forecasts and news')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // API prefix
  app.setGlobalPrefix('v1');

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`\n🚀 Crypto Analysis API running on http://localhost:${port}`);
  console.log(`📖 OpenAPI docs: http://localhost:${port}/api/docs`);
  console.log(`🔌 WebSocket: ws://localhost:${port}`);

  const provider = process.env.EXCHANGE_PROVIDER ?? 'demo';
  if (provider === 'demo') {
    console.log(`\n⚠️  DEMO MODE — deterministic data only. Set EXCHANGE_PROVIDER=binance for live data.`);
  }
}

bootstrap().catch(console.error);
