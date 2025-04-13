import { Controller, Get, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { WhatsappSessionService } from '../../services/session/whatsapp-session.service';
import { ServiceStatusResponseDto } from '../../dto/responses/maintenance-response.dto';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { SessionError } from '../../errors/whatsapp.error';

/**
 * Controlador responsável pelo monitoramento do status
 * do sistema WhatsApp
 */
@ApiTags('WhatsApp - Status do Sistema')
@Controller('whatsapp/system')
export class SystemStatusController {
  private readonly logger = new Logger(SystemStatusController.name);

  constructor(private readonly sessionService: WhatsappSessionService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Verificar status do serviço',
    description:
      'Retorna o status geral do serviço WhatsApp e suas dependências',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Status do serviço obtido com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          status: 'online',
          activeSessions: 2,
          uptime: '2d 3h 45m',
        },
        message: 'Serviço operando normalmente',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async getServiceStatus(): Promise<ApiResponse<ServiceStatusResponseDto>> {
    this.logger.log('[API] Requisição para verificar status do serviço');

    try {
      const status = await this.sessionService.getServiceStatus();
      return {
        success: true,
        data: status,
        message: 'Serviço operando normalmente',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao verificar status do serviço: ${error.message}`,
      );
      throw new SessionError('Falha ao verificar status do serviço', {
        originalError: error.message,
      });
    }
  }
}
