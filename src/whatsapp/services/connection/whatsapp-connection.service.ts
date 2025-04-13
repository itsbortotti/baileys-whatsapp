import { Injectable, Logger } from '@nestjs/common';
import {
  SESSION_STATUS,
  SessionStatus,
} from '../../constants/whatsapp.constants';
import {
  cleanAllSessionFiles,
  cleanSessionFiles,
} from '../../utils/file-cleaner.util';

import { ConnectionState as BaileysConnectionState } from '@whiskeysockets/baileys';
import { CleanFilesResponseDto } from '../../dto/responses/maintenance-response.dto';
import { ConnectionError } from '../../errors/whatsapp.error';
import { ConnectionEventsService } from './connection-events.service';
import { ConnectionManagerService } from './connection-manager.service';
import { ConnectionState } from '../../types';
import { ConnectionStateService } from './connection-state.service';
import { toBaileysConnectionState } from '../../types/connection.types';

@Injectable()
export class WhatsappConnectionService {
  private readonly logger = new Logger(WhatsappConnectionService.name);

  constructor(
    private readonly eventsService: ConnectionEventsService,
    private readonly managerService: ConnectionManagerService,
    private readonly stateService: ConnectionStateService,
  ) {}

  async connect(sessionId: string): Promise<ConnectionState> {
    this.logger.log(`Iniciando conexão para sessão ${sessionId}`);

    try {
      await this.eventsService.setupConnectionHandlers(sessionId);
      await this.managerService.initializeConnection(sessionId);
      return await this.getConnectionState(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao conectar sessão ${sessionId}: ${error.message}`,
      );
      throw new ConnectionError('Falha ao estabelecer conexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    this.logger.log(`Desconectando sessão ${sessionId}`);

    try {
      await this.managerService.closeConnection(sessionId);
      await this.eventsService.removeConnectionHandlers(sessionId);
      await this.clearConnectionState(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao desconectar sessão ${sessionId}: ${error.message}`,
      );
      throw new ConnectionError('Falha ao encerrar conexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  async getConnectionState(sessionId: string): Promise<ConnectionState> {
    try {
      const state = await this.stateService.getState(sessionId);
      return state;
    } catch (error) {
      throw new ConnectionError('Falha ao obter estado da conexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  async clearConnectionState(sessionId: string): Promise<void> {
    try {
      await this.stateService.clearState(sessionId);
    } catch (error) {
      throw new ConnectionError('Falha ao limpar estado da conexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  async isConnected(sessionId: string): Promise<boolean> {
    try {
      const state = await this.stateService.getState(sessionId);
      // Converter para o tipo do Baileys antes de comparar
      const baileysState = toBaileysConnectionState(state);
      return baileysState.connection === 'open';
    } catch (error) {
      this.logger.error(
        `Erro ao verificar estado da conexão ${sessionId}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Atualiza o estado da conexão
   * @param sessionId ID da sessão
   * @param state Novo estado da conexão
   */
  async setConnectionState(
    sessionId: string,
    state: BaileysConnectionState,
  ): Promise<void> {
    try {
      await this.stateService.updateState(sessionId, state);
    } catch (error) {
      throw new ConnectionError('Falha ao atualizar estado da conexão', {
        sessionId,
        state,
        originalError: error.message,
      });
    }
  }

  async reconnect(sessionId: string): Promise<ConnectionState> {
    this.logger.log(`Tentando reconexão para sessão ${sessionId}`);

    try {
      await this.disconnect(sessionId);
      return await this.connect(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao reconectar sessão ${sessionId}: ${error.message}`,
      );
      throw new ConnectionError('Falha na reconexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Limpa todos os arquivos temporários do sistema
   * Remove arquivos de cache e temporários de todas as sessões
   */
  async cleanTemporaryFiles(): Promise<CleanFilesResponseDto> {
    this.logger.log('Iniciando limpeza de arquivos temporários do sistema');

    try {
      const result = await cleanAllSessionFiles();

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
        filesRemoved: result.details?.successful || 0,
        details: {
          ...result.details,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao limpar arquivos temporários: ${error.message}`,
      );
      throw new ConnectionError('Falha ao limpar arquivos temporários', {
        originalError: error.message,
      });
    }
  }

  /**
   * Limpa arquivos temporários de uma sessão específica
   * @param sessionId ID da sessão para limpeza
   */
  async clearConnectionFiles(
    sessionId: string,
  ): Promise<CleanFilesResponseDto> {
    this.logger.log(`Iniciando limpeza de arquivos da sessão ${sessionId}`);

    try {
      const result = await cleanSessionFiles(sessionId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
        filesRemoved: result.details?.filesRemoved || 0,
        details: {
          sessionId,
          ...result.details,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao limpar arquivos da sessão ${sessionId}: ${error.message}`,
      );
      throw new ConnectionError('Falha ao limpar arquivos da sessão', {
        sessionId,
        originalError: error.message,
      });
    }
  }
}
