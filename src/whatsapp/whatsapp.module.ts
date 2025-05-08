import { Message } from './entities/message.entity';
import { MessageService } from './services/message.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppConnectionService } from './services/whatsapp-connection.service';
import { WhatsAppEventService } from './services/whatsapp-event.service';
import { WhatsAppMessageController } from './controllers/whatsapp-message.controller';
import { WhatsAppMessageService } from './services/whatsapp-message.service';
import { WhatsAppQRService } from './services/whatsapp-qr.service';
import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappService } from './services/whatsapp.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  controllers: [
    WhatsappController,
    WhatsAppMessageController
  ],
  providers: [
    WhatsappService,
    WhatsAppConnectionService,
    WhatsAppEventService,
    WhatsAppQRService,
    WhatsAppMessageService,
    MessageService
  ],
})
export class WhatsappModule {}