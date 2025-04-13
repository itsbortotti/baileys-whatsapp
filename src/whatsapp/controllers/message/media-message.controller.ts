import {
  Controller,
  Post,
  Body,
  Param,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { WhatsappMessageService } from '../../services/message/whatsapp-message.service';
import { SendImageDto } from '../../dto';
import { SendImageResponseDto } from '../../dto/responses/message-response.dto';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { MessageError } from '../../errors/whatsapp.error';
import { SessionIdParam } from '../params/session-id.param';

/**
 * Controlador responsável pelo envio de mensagens com mídia
 * via WhatsApp (imagens, áudio, vídeo, etc)
 */
@ApiTags('WhatsApp - Mensagens com Mídia')
@Controller('whatsapp/message')
export class MediaMessageController {
  private readonly logger = new Logger(MediaMessageController.name);

  constructor(private readonly messageService: WhatsappMessageService) {}

  @Post(':sessionId/send-image')
  @ApiOperation({
    summary: 'Enviar imagem',
    description:
      'Envia uma imagem com ou sem legenda para um contato via WhatsApp',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Identificador único da sessão',
    example: 'user123',
    type: String,
  })
  @ApiBody({ type: SendImageDto })
  @SwaggerResponse({
    status: 200,
    description: 'Imagem enviada com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          messageId: 'ABCDEF123456789012345',
          to: '5511999999999',
        },
        message: 'Imagem enviada com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async sendImage(
    @Param('sessionId', new ValidationPipe({ transform: true }))
    param: SessionIdParam,
    @Body() sendImageDto: SendImageDto,
  ): Promise<ApiResponse<SendImageResponseDto>> {
    this.logger.log(
      `[API] Requisição para enviar imagem para ${sendImageDto.to} via sessão: ${param.sessionId}`,
    );

    try {
      const result = await this.messageService.sendImage(
        param.sessionId,
        sendImageDto,
      );
      return {
        success: true,
        data: {
          ...result,
          to: sendImageDto.to,
        },
        message: 'Imagem enviada com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao enviar imagem para ${sendImageDto.to} via sessão ${param.sessionId}: ${error.message}`,
      );
      throw new MessageError('Falha ao enviar imagem', {
        sessionId: param.sessionId,
        to: sendImageDto.to,
        originalError: error.message,
      });
    }
  }
}
