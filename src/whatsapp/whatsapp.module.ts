import { Module } from '@nestjs/common';
import { WhatsAppConnectionService } from './services/whatsapp-connection.service';
import { WhatsappController } from './controllers/whatsapp.controller';
import { WhatsappService } from './services/whatsapp.service';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsAppConnectionService],
  exports: [WhatsappService]
})
export class WhatsappModule {}