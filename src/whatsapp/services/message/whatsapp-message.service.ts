import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto, SendImageDto } from '../../dto';
import {
  SendMessageResponseDto,
  SendImageResponseDto,
} from '../../dto/responses/message-response.dto';
import { MessageError } from '../../errors/whatsapp.error';
import { TextMessageService } from './text-message.service';
import { MediaMessageService } from './media-message.service';
import { MessageQueueService } from './message-queue.service';
import { WhatsappConnectionService } from '../connection/whatsapp-connection.service';

@Injectable()
export class WhatsappMessageService {
  private readonly logger = new Logger(WhatsappMessageService.name);

  constructor(
    private readonly textService: TextMessageService,
    private readonly mediaService: MediaMessageService,
    private readonly queueService: MessageQueueService,
    private readonly connectionService: WhatsappConnectionService,
  ) {}

  async sendTextMessage(
    sessionId: string,
    messageData: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    this.logger.log(`Processando mensagem de texto para ${messageData.to}`);

    try {
      await this.ensureSessionConnected(sessionId);

      return await this.queueService.enqueue(sessionId, () =>
        this.textService.sendMessage(sessionId, messageData),
      );
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de texto: ${error.message}`);
      throw new MessageError('Falha ao enviar mensagem de texto', {
        sessionId,
        to: messageData.to,
        originalError: error.message,
      });
    }
  }

  async sendImage(
    sessionId: string,
    imageData: SendImageDto,
  ): Promise<SendImageResponseDto> {
    this.logger.log(`Processando envio de imagem para ${imageData.to}`);

    try {
      await this.ensureSessionConnected(sessionId);

      return await this.queueService.enqueue(sessionId, () =>
        this.mediaService.sendImage(sessionId, imageData),
      );
    } catch (error) {
      this.logger.error(`Erro ao enviar imagem: ${error.message}`);
      throw new MessageError('Falha ao enviar imagem', {
        sessionId,
        to: imageData.to,
        originalError: error.message,
      });
    }
  }

  private async ensureSessionConnected(sessionId: string): Promise<void> {
    const isConnected = await this.connectionService.isConnected(sessionId);

    if (!isConnected) {
      throw new MessageError('Sessão não está conectada', { sessionId });
    }
  }
}
