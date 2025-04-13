import { Injectable, Logger } from '@nestjs/common';
import { MessageError } from '../../errors/whatsapp.error';
import { SendImageDto } from '../../dto';
import { SendImageResponseDto } from '../../dto/responses/message-response.dto';
import { MessageValidatorService } from './message-validator.service';

@Injectable()
export class MediaMessageService {
  private readonly logger = new Logger(MediaMessageService.name);

  constructor(private readonly validator: MessageValidatorService) {}

  async sendImage(
    sessionId: string,
    imageData: SendImageDto,
  ): Promise<SendImageResponseDto> {
    this.logger.log(
      `Enviando imagem para ${imageData.to} via sessão ${sessionId}`,
    );

    try {
      this.validator.validateImageMessage(imageData);

      const formattedNumber = this.validator.formatPhoneNumber(imageData.to);

      const result: SendImageResponseDto = {
        success: true,
        messageId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: formattedNumber,
      };

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao enviar imagem para ${imageData.to}: ${error.message}`,
      );
      throw new MessageError('Falha ao enviar imagem', {
        sessionId,
        to: imageData.to,
        originalError: error.message,
      });
    }
  }
}
