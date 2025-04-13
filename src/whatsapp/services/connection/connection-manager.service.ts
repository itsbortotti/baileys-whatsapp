import { Injectable, Logger } from '@nestjs/common';
import { ConnectionError } from '../../errors/whatsapp.error';
import { ConnectionStateService } from './connection-state.service';
import { ConnectionEventsService } from './connection-events.service';
import {
  SessionStateService,
  SessionStatus,
} from '../session/session-state.service';
import { WASocket } from '@whiskeysockets/baileys';

interface EventHandlers {
  onQRCode?: (qr: string) => Promise<void>;
  onConnected?: () => Promise<void>;
  onDisconnected?: () => Promise<void>;
}

/**
 * Serviço principal de gerenciamento de conexões WhatsApp
 * Coordena operações entre estado e eventos de conexão
 */
@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private readonly connections = new Map<string, any>(); // usando any temporariamente para evitar problemas de tipo
  private readonly eventHandlers = new Map<string, EventHandlers>();

  constructor(
    private readonly stateService: ConnectionStateService,
    private readonly eventsService: ConnectionEventsService,
    private readonly sessionStateService: SessionStateService,
  ) {}

  /**
   * Inicia uma nova conexão WhatsApp
   */
  async initializeConnection(sessionId: string): Promise<void> {
    this.logger.log(`Iniciando conexão para sessão: ${sessionId}`);

    try {
      await this.sessionStateService.updateSessionStatus(
        sessionId,
        SessionStatus.CONNECTING,
      );

      // Inicialização da conexão Baileys
      const connection = await this.stateService.createConnection(sessionId);
      this.connections.set(sessionId, connection);
    } catch (error) {
      this.logger.error(`Erro ao inicializar conexão: ${error.message}`);
      await this.sessionStateService.updateSessionStatus(
        sessionId,
        SessionStatus.FAILED,
      );
      throw new ConnectionError('Falha ao inicializar conexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }
  /**
   * Registra handlers para eventos de uma conexão
   */
  async registerEventHandlers(
    sessionId: string,
    handlers: EventHandlers,
  ): Promise<void> {
    this.logger.debug(
      `Registrando handlers de eventos para sessão ${sessionId}`,
    );

    try {
      this.eventHandlers.set(sessionId, handlers);
      const connection = this.connections.get(sessionId);

      if (connection) {
        // Registra handlers de eventos do Baileys
        connection.ev.on('connection.update', async (update) => {
          if (update.qr) {
            const handler = this.eventHandlers.get(sessionId)?.onQRCode;
            if (handler) {
              await handler(update.qr);
            }
          }

          if (update.connection === 'open') {
            const handler = this.eventHandlers.get(sessionId)?.onConnected;
            if (handler) {
              await handler();
            }
          }

          if (update.connection === 'close') {
            const handler = this.eventHandlers.get(sessionId)?.onDisconnected;
            if (handler) {
              await handler();
            }
          }
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao registrar handlers: ${error.message}`);
      throw new ConnectionError('Falha ao registrar handlers de eventos', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Remove handlers de eventos de uma conexão
   */
  async unregisterEventHandlers(sessionId: string): Promise<void> {
    try {
      const connection = this.connections.get(sessionId);
      if (connection) {
        // Remove todos os listeners de eventos do Baileys
        connection.ev.removeAllListeners('connection.update');
        // Precisa passar um listener vazio como segundo argumento
        connection.ev.off('connection.update', () => {});
      }
    } catch (error) {
      this.logger.error(`Erro ao remover handlers: ${error.message}`);
      throw new ConnectionError('Falha ao remover handlers de eventos', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Cria uma nova sessão
   */
  async createSession(sessionId: string): Promise<void> {
    this.logger.debug(`Criando nova sessão ${sessionId}`);
    await this.sessionStateService.createSession(sessionId);
  }

  /**
   * Remove uma sessão existente
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.logger.debug(`Removendo sessão ${sessionId}`);
    await this.closeConnection(sessionId);
    await this.unregisterEventHandlers(sessionId);
    await this.sessionStateService.clearSessionState(sessionId);
  }

  /**
   * Encerra uma conexão existente
   */
  async closeConnection(sessionId: string): Promise<void> {
    this.logger.debug(`Fechando conexão da sessão ${sessionId}`);

    try {
      const connection = this.connections.get(sessionId);
      if (connection) {
        this.logger.log(`Encerrando conexão da sessão ${sessionId}`);
        // Passar undefined como argumento para o método end
        await connection.end(undefined);
        this.connections.delete(sessionId);
      }

      await this.sessionStateService.updateSessionStatus(
        sessionId,
        SessionStatus.DISCONNECTED,
      );
    } catch (error) {
      this.logger.error(`Erro ao fechar conexão: ${error.message}`);
      throw new ConnectionError('Falha ao fechar conexão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Lista todas as sessões disponíveis
   */
  async listSessions(): Promise<string[]> {
    const sessionsInfo = await this.sessionStateService.getAllSessions();
    return sessionsInfo.sessions.map((session) => session.sessionId);
  }
}
