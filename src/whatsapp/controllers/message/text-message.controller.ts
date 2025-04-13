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
import { SendMessageDto } from '../../dto';
import { SendMessageResponseDto } from '../../dto/responses/message-response.dto';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { MessageError } from '../../errors/whatsapp.error';
import { SessionIdParam } from '../params/session-id.param';

/**
 * Controlador responsável pelo envio de mensagens de texto
 * via WhatsApp
 */
@ApiTags('WhatsApp - Mensagens de Texto')
@Controller('whatsapp/message')
export class TextMessageController {
  private readonly logger = new Logger(TextMessageController.name);

  constructor(private readonly messageService: WhatsappMessageService) {}

  @Post(':sessionId/send')
  @ApiOperation({
    summary: 'Enviar mensagem de texto',
    description: 'Envia uma mensagem de texto para um contato via WhatsApp',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Identificador único da sessão',
    example: 'user123',
    type: String,
  })
  @ApiBody({ type: SendMessageDto })
  @SwaggerResponse({
    status: 200,
    description: 'Mensagem enviada com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          messageId: 'ABCDEF123456789012345',
          to: '5511999999999',
        },
        message: 'Mensagem enviada com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async sendMessage(
    @Param('sessionId', new ValidationPipe({ transform: true }))
    param: SessionIdParam,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<ApiResponse<SendMessageResponseDto>> {
    this.logger.log(
      `[API] Requisição para enviar mensagem de texto para ${sendMessageDto.to} via sessão: ${param.sessionId}`,
    );

    try {
      const result = await this.messageService.sendTextMessage(
        param.sessionId,
        sendMessageDto,
      );
      return {
        success: true,
        data: {
          ...result,
          to: sendMessageDto.to,
        },
        message: 'Mensagem enviada com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem para ${sendMessageDto.to} via sessão ${param.sessionId}: ${error.message}`,
      );
      throw new MessageError('Falha ao enviar mensagem', {
        sessionId: param.sessionId,
        to: sendMessageDto.to,
        originalError: error.message,
      });
    }
  }
}
