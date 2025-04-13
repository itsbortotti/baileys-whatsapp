import { Injectable, Logger } from '@nestjs/common';
import { MessageError } from '../../errors/whatsapp.error';
import { SendMessageDto } from '../../dto';
import { SendMessageResponseDto } from '../../dto/responses/message-response.dto';
import { MessageValidatorService } from './message-validator.service';

@Injectable()
export class TextMessageService {
  private readonly logger = new Logger(TextMessageService.name);

  constructor(private readonly validator: MessageValidatorService) {}

  async sendMessage(
    sessionId: string,
    messageData: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    this.logger.log(
      `Enviando mensagem de texto para ${messageData.to} via sessão ${sessionId}`,
    );

    try {
      this.validator.validateTextMessage(messageData);

      const formattedNumber = this.validator.formatPhoneNumber(messageData.to);

      const result: SendMessageResponseDto = {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: formattedNumber,
      };

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem para ${messageData.to}: ${error.message}`,
      );
      throw new MessageError('Falha ao enviar mensagem', {
        sessionId,
        to: messageData.to,
        originalError: error.message,
      });
    }
  }
}
