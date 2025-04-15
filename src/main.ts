import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { closeRedisConnection, sessionMiddleware } from './config/redis.config';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(sessionMiddleware);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API WhatsApp Baileys')
    .setDescription('API de integração com WhatsApp usando Baileys')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      deepLinking: true,
    },
    customSiteTitle: 'API WhatsApp - Documentação',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Aplicação iniciada na porta ${port}`);
}

process.on('SIGINT', async () => {
  const logger = new Logger('Shutdown');
  logger.log('Sinal de encerramento da aplicação recebido');
  await closeRedisConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const logger = new Logger('Shutdown');
  logger.log('Sinal de terminação da aplicação recebido');
  await closeRedisConnection();
  process.exit(0);
});

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Falha ao iniciar a aplicação:', error);
  closeRedisConnection().finally(() => process.exit(1));
});
