import { Injectable, Logger } from '@nestjs/common';

import { CreateSessionDto } from '../../dto/requests/create-session.dto';
import { SessionError } from '../../errors/whatsapp.error';
import { SessionEventsService } from './session-events.service';
import { SessionStateService } from './session-state.service';
import { SessionStatusResponseDto } from '../../dto/responses/session-response.dto';

/**
 * Serviço responsável pelo gerenciamento principal de sessões do WhatsApp.
 * Coordena operações entre estado e eventos de sessão.
 */
@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);

  constructor(
    private readonly stateService: SessionStateService,
    private readonly eventsService: SessionEventsService,
  ) {}

  /**
   * Cria uma nova sessão do WhatsApp
   */
  async createSession(
    sessionId: string,
    options?: CreateSessionDto['options'],
    callbacks?: CreateSessionDto['callbacks'],
  ): Promise<SessionStatusResponseDto> {
    this.logger.log(`Iniciando criação de sessão: ${sessionId}`);

    try {
      // Verificar se já existe
      if (await this.stateService.sessionExists(sessionId)) {
        throw new SessionError('Sessão já existe', { sessionId });
      }

      // Criar nova sessão
      await this.stateService.createSession(sessionId, options);

      // Configurar callbacks
      if (callbacks) {
        await this.eventsService.setupCallbacks(sessionId, callbacks);
      }

      // Retornar status inicial da sessão
      return {
        success: true,
        sessionId,
        status: 'disconnected',
      };
    } catch (error) {
      this.logger.error(`Erro ao criar sessão ${sessionId}: ${error.message}`);
      throw new SessionError('Falha ao criar sessão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Obtém o status de uma sessão
   */
  async getStatus(sessionId: string): Promise<SessionStatusResponseDto> {
    this.logger.log(`Obtendo status da sessão: ${sessionId}`);

    try {
      const status = await this.stateService.getSessionStatus(sessionId);
      return {
        success: true,
        sessionId,
        status,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter status da sessão ${sessionId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getQrCode(sessionId: string): Promise<string | null> {
    this.logger.debug(`Obtendo QR code para sessão ${sessionId}`);

    try {
      const status = await this.stateService.getSessionStatus(sessionId);

      if (status !== 'connecting') {
        return null;
      }

      // Obter QR code através do estado da sessão
      return await this.stateService.getSessionQRCode(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao obter QR code da sessão ${sessionId}: ${error.message}`,
      );
      throw error;
    }
  }

  async listSessions(): Promise<string[]> {
    this.logger.debug('Listando todas as sessões');

    try {
      return await this.stateService.listSessions();
    } catch (error) {
      this.logger.error(`Erro ao listar sessões: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exclui uma sessão existente
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.logger.log(`Deletando sessão ${sessionId}`);

    try {
      if (!(await this.stateService.sessionExists(sessionId))) {
        throw new SessionError('Sessão não encontrada', { sessionId });
      }

      // Remover callbacks de eventos
      await this.eventsService.removeCallbacks(sessionId);

      // Limpar estado da sessão
      await this.stateService.clearSessionState(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao deletar sessão ${sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao deletar sessão', {
        sessionId,
        originalError: error.message,
      });
    }
  }
}
