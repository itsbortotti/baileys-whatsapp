import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('WhatsApp API')
    .setDescription('API para gerenciamento de sessões do WhatsApp usando Baileys')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const appUrl = await app.getUrl();
  console.log('=== Informações do Ambiente ===');
  console.log(`🚀 Servidor rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:${port}/api`);
  console.log('==============================');
}

bootstrap();