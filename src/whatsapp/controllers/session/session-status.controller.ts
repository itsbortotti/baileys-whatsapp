import { Controller, Get, Param, Logger, ValidationPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WhatsappSessionService } from '../../services/session/whatsapp-session.service';
import {
  SessionStatusResponseDto,
  SessionsListResponseDto,
} from '../../dto/responses/session-response.dto';
import { SessionIdParam } from '../params/session-id.param';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { SessionError } from '../../errors/whatsapp.error';

/**
 * Controlador responsável pelo monitoramento e verificação
 * de status das sessões do WhatsApp
 */
@ApiTags('WhatsApp - Status de Sessões')
@Controller('whatsapp/session')
export class SessionStatusController {
  private readonly logger = new Logger(SessionStatusController.name);

  constructor(private readonly sessionService: WhatsappSessionService) {}

  /**
   * Obtém o status de uma sessão específica
   */
  @Get(':sessionId/status')
  @ApiOperation({
    summary: 'Verificar status de uma sessão',
    description: 'Retorna o status atual de uma sessão do WhatsApp',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Identificador único da sessão',
    example: 'user123',
    type: String,
  })
  @SwaggerResponse({
    status: 200,
    description: 'Status obtido com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          connected: true,
          sessionId: 'user123',
        },
        message: 'Status obtido com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  @SwaggerResponse({
    status: 404,
    description: 'Sessão não encontrada',
    schema: {
      example: {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Sessão não encontrada',
          details: { sessionId: 'user123' },
        },
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async getStatus(
    @Param('sessionId', new ValidationPipe({ transform: true }))
    param: SessionIdParam,
  ): Promise<ApiResponse<SessionStatusResponseDto>> {
    this.logger.log(
      `[API] Requisição para verificar status da sessão: ${param.sessionId}`,
    );

    try {
      const status = await this.sessionService.getSessionStatus(
        param.sessionId,
      );
      return {
        success: true,
        data: status,
        message: 'Status obtido com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter status da sessão ${param.sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao obter status da sessão', {
        sessionId: param.sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Lista todas as sessões ativas e seus status
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todas as sessões',
    description: 'Retorna a lista de todas as sessões do WhatsApp existentes',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Lista de sessões obtida com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          count: 2,
          sessions: [
            { sessionId: 'user123', connected: true },
            { sessionId: 'user456', connected: false },
          ],
        },
        message: 'Lista de sessões obtida com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async getAllSessions(): Promise<ApiResponse<SessionsListResponseDto>> {
    this.logger.log('[API] Requisição para listar todas as sessões');

    try {
      const sessionsData = await this.sessionService.listSessions();
      return {
        success: true,
        data: {
          count: sessionsData.count,
          sessions: sessionsData.sessions,
          success: true,
        },
        message: 'Lista de sessões obtida com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Erro ao listar sessões: ${error.message}`);
      throw new SessionError('Falha ao listar sessões', {
        originalError: error.message,
      });
    }
  }
}
