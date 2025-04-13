import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { HttpExceptionFilter } from './whatsapp/filters/http-exception.filter';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WhatsappModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
