import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsappService } from '../services/whatsapp.service';
import { WhatsAppMessageService } from '../services/whatsapp-message.service';
import { IMessageRequest } from '../interfaces/message-request.interface';

@ApiTags('WhatsApp Messages')
@Controller('whatsapp/session/:sessionId/message')
export class WhatsAppMessageController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly messageService: WhatsAppMessageService
  ) {}

  /**
   * Envia uma mensagem de texto
   * @param sessionId ID da sessão
   * @param messageRequest Dados da mensagem
   */
  @Post('text')
  @ApiOperation({ summary: 'Enviar mensagem de texto' })
  @ApiResponse({ 
    status: 201, 
    description: 'Mensagem enviada com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Formato de número inválido ou mensagem vazia' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Sessão não encontrada' 
  })
  async sendTextMessage(
    @Param('sessionId') sessionId: string,
    @Body() messageRequest: IMessageRequest
  ): Promise<void> {
    const session = await this.whatsappService.getSession(sessionId);
    await this.messageService.sendTextMessage(session.sock, messageRequest, sessionId);
  }
}