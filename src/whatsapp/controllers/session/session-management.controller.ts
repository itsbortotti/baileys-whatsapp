import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Logger,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { WhatsappSessionService } from '../../services/session/whatsapp-session.service';
import { CreateSessionDto } from '../../dto';
import {
  CreateSessionResponseDto,
  DisconnectSessionResponseDto,
} from '../../dto/responses/session-response.dto';
import { SessionIdParam } from '../params/session-id.param';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { SessionError } from '../../errors/whatsapp.error';

/**
 * Controlador responsável pela criação e remoção
 * de sessões do WhatsApp
 */
@ApiTags('WhatsApp - Gerenciamento de Sessões')
@Controller('whatsapp/session')
export class SessionManagementController {
  private readonly logger = new Logger(SessionManagementController.name);

  constructor(private readonly sessionService: WhatsappSessionService) {}

  /**
   * Cria uma nova sessão do WhatsApp
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar uma nova sessão',
    description:
      'Cria uma nova sessão do WhatsApp com as configurações especificadas',
  })
  @ApiBody({ type: CreateSessionDto })
  @SwaggerResponse({
    status: 201,
    description: 'Sessão criada com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          success: true,
          sessionId: 'user123',
        },
        message: 'Sessão criada com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  @SwaggerResponse({
    status: 400,
    description: 'Dados inválidos para criação da sessão',
    schema: {
      example: {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Dados inválidos para criação da sessão',
          details: {
            sessionId: 'user123',
            error: 'Configurações inválidas',
          },
        },
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<ApiResponse<CreateSessionResponseDto>> {
    this.logger.log(
      `[API] Requisição para criar sessão: ${createSessionDto.sessionId}`,
    );

    try {
      const result = await this.sessionService.createSession(createSessionDto);

      return {
        success: true,
        data: result,
        message: 'Sessão criada com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao criar sessão ${createSessionDto.sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao criar sessão', {
        sessionId: createSessionDto.sessionId,
        options: createSessionDto.options,
        originalError: error.message,
      });
    }
  }

  /**
   * Desconecta e remove uma sessão existente
   */
  @Delete(':sessionId')
  @ApiOperation({
    summary: 'Desconectar uma sessão',
    description: 'Desconecta e remove uma sessão específica do WhatsApp',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Identificador único da sessão',
    example: 'user123',
    type: String,
  })
  @SwaggerResponse({
    status: 200,
    description: 'Sessão desconectada com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          success: true,
          sessionId: 'user123',
        },
        message: 'Sessão desconectada com sucesso',
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
  async disconnectSession(
    @Param('sessionId', new ValidationPipe({ transform: true }))
    param: SessionIdParam,
  ): Promise<ApiResponse<DisconnectSessionResponseDto>> {
    this.logger.log(
      `[API] Requisição para desconectar sessão: ${param.sessionId}`,
    );

    try {
      await this.sessionService.deleteSession(param.sessionId);
      return {
        success: true,
        data: { success: true },
        message: 'Sessão desconectada com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao desconectar sessão ${param.sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao desconectar sessão', {
        sessionId: param.sessionId,
        originalError: error.message,
      });
    }
  }
}
