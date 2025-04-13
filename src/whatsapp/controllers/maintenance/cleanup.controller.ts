import {
  Controller,
  Post,
  Delete,
  Param,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiParam,
} from '@nestjs/swagger';
import { WhatsappConnectionService } from '../../services/connection/whatsapp-connection.service';
import { CleanFilesResponseDto } from '../../dto/responses/maintenance-response.dto';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { SessionError } from '../../errors/whatsapp.error';
import { SessionIdParam } from '../params/session-id.param';

/**
 * Controlador responsável pelas operações de limpeza
 * e manutenção do sistema WhatsApp
 */
@ApiTags('WhatsApp - Limpeza e Manutenção')
@Controller('whatsapp/maintenance')
export class CleanupController {
  private readonly logger = new Logger(CleanupController.name);

  constructor(private readonly connectionService: WhatsappConnectionService) {}

  @Post('clean')
  @ApiOperation({
    summary: 'Limpar arquivos temporários',
    description: 'Remove arquivos temporários e cache do sistema',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Limpeza realizada com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          filesRemoved: 10,
          spaceSaved: '50MB',
        },
        message: 'Limpeza concluída com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async cleanSystemFiles(): Promise<ApiResponse<CleanFilesResponseDto>> {
    this.logger.log(
      '[API] Requisição para limpar arquivos temporários do sistema',
    );

    try {
      const result = await this.connectionService.cleanTemporaryFiles();
      return {
        success: true,
        data: result,
        message: 'Limpeza concluída com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao limpar arquivos temporários: ${error.message}`,
      );
      throw new SessionError('Falha ao limpar arquivos', {
        originalError: error.message,
      });
    }
  }

  @Delete('session/:sessionId/files')
  @ApiOperation({
    summary: 'Limpar arquivos de uma sessão',
    description: 'Remove os arquivos temporários de uma sessão específica',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Identificador único da sessão',
    example: 'user123',
    type: String,
  })
  @SwaggerResponse({
    status: 200,
    description: 'Arquivos da sessão limpos com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          filesRemoved: 5,
          sessionId: 'user123',
        },
        message: 'Arquivos da sessão limpos com sucesso',
        timestamp: '2025-04-12T22:30:05.689Z',
      },
    },
  })
  async cleanSessionFiles(
    @Param('sessionId', new ValidationPipe({ transform: true }))
    param: SessionIdParam,
  ): Promise<ApiResponse<CleanFilesResponseDto>> {
    this.logger.log(
      `[API] Requisição para limpar arquivos da sessão: ${param.sessionId}`,
    );

    try {
      const result = await this.connectionService.clearConnectionFiles(
        param.sessionId,
      );
      return {
        success: true,
        data: result,
        message: 'Arquivos da sessão limpos com sucesso',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao limpar arquivos da sessão ${param.sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao limpar arquivos da sessão', {
        sessionId: param.sessionId,
        originalError: error.message,
      });
    }
  }
}
