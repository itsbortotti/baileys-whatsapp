import { Controller, Get, Param, Logger, ValidationPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WhatsappSessionService } from '../../services/session/whatsapp-session.service';
import { QrCodeResponseDto } from '../../dto/responses/session-response.dto';
import { SessionIdParam } from '../params/session-id.param';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { SessionError } from '../../errors/whatsapp.error';

/**
 * Controlador responsável pelo gerenciamento de QR codes para autenticação
 * de sessões do WhatsApp
 */
@ApiTags('WhatsApp - QR Code')
@Controller('whatsapp/session')
export class SessionQRController {
  private readonly logger = new Logger(SessionQRController.name);

  constructor(private readonly sessionService: WhatsappSessionService) {}

  /**
   * Obtém o código QR de uma sessão específica
   */
  @Get(':sessionId/qr')
  @ApiOperation({
    summary: 'Obter QR code de uma sessão',
    description:
      'Retorna o QR code para autenticação de uma sessão do WhatsApp',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Identificador único da sessão',
    example: 'user123',
    type: String,
  })
  @SwaggerResponse({
    status: 200,
    description: 'QR code obtido com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          qrCode: 'base64-encoded-qr-code',
          sessionId: 'user123',
        },
        message: 'QR Code obtido com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  @SwaggerResponse({
    status: 404,
    description: 'Sessão não encontrada ou QR code não disponível',
    schema: {
      example: {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Sessão não encontrada ou QR code não disponível',
          details: { sessionId: 'user123' },
        },
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async getQRCode(
    @Param('sessionId', new ValidationPipe({ transform: true }))
    param: SessionIdParam,
  ): Promise<ApiResponse<QrCodeResponseDto>> {
    this.logger.log(
      `[API] Requisição para obter QR code da sessão: ${param.sessionId}`,
    );

    try {
      const qrCode = await this.sessionService.getQRCode(param.sessionId);
      return {
        success: true,
        data: qrCode,
        message: 'QR Code obtido com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter QR code para sessão ${param.sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao obter QR Code', {
        sessionId: param.sessionId,
        originalError: error.message,
      });
    }
  }
}
