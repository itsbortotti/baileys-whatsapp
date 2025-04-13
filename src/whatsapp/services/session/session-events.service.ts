import { Injectable, Logger } from '@nestjs/common';
import { SessionError } from '../../errors/whatsapp.error';
import { CreateSessionDto } from '../../dto/requests/create-session.dto';
import { SessionStateService, SessionStatus } from './session-state.service';
import { ConnectionManagerService } from '../connection/connection-manager.service';

/**
 * Serviço responsável pelo gerenciamento de eventos das sessões.
 * Configura callbacks e gerencia notificações de eventos.
 */
@Injectable()
export class SessionEventsService {
  private readonly logger = new Logger(SessionEventsService.name);
  private readonly callbacks = new Map<string, CreateSessionDto['callbacks']>();
  private readonly eventHandlers = new Map<string, () => void>();

  constructor(
    private readonly stateService: SessionStateService,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  /**
   * Remove os handlers de eventos de uma sessão
   */
  async removeEventHandlers(sessionId: string): Promise<void> {
    this.logger.debug(`Removendo handlers de eventos da sessão ${sessionId}`);

    const cleanup = this.eventHandlers.get(sessionId);
    if (cleanup) {
      cleanup();
      this.eventHandlers.delete(sessionId);
    }
  }

  /**
   * Remove os callbacks de uma sessão
   */
  async removeCallbacks(sessionId: string): Promise<void> {
    this.logger.debug(`Removendo callbacks da sessão ${sessionId}`);
    this.callbacks.delete(sessionId);
  }

  /**
   * Configura callbacks para eventos de uma sessão
   */
  async setupCallbacks(
    sessionId: string,
    callbacks: CreateSessionDto['callbacks'],
  ): Promise<void> {
    this.logger.log(
      `Configurando handlers de eventos para sessão: ${sessionId}`,
    );

    try {
      // Remove handlers existentes
      await this.removeEventHandlers(sessionId);

      // Configurar novos handlers apenas se houver callbacks definidos
      if (typeof callbacks === 'object' && callbacks !== null) {
        this.callbacks.set(sessionId, callbacks);

        // Configurar handlers específicos
        await this.registerEventHandlers(sessionId, callbacks);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao configurar handlers da sessão ${sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao configurar handlers de eventos', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Configura handlers para diferentes tipos de eventos
   */
  private async registerEventHandlers(
    sessionId: string,
    callbacks: CreateSessionDto['callbacks'],
  ): Promise<void> {
    // Se não houver callbacks definidos, criar um objeto vazio
    const safeCallbacks = callbacks || {};

    const eventHandlers = {
      onQRCode: async (qr: string) => {
        try {
          this.logger.debug(`QR Code recebido para sessão ${sessionId}`);
          await this.stateService.updateSessionStatus(
            sessionId,
            SessionStatus.CONNECTING,
          );
          // Verificar se o callback existe e é uma função antes de chamar
          if (
            safeCallbacks.onQRCode &&
            typeof safeCallbacks.onQRCode === 'function'
          ) {
            await safeCallbacks.onQRCode(sessionId, qr);
          }
        } catch (error) {
          this.logger.error(`Erro no handler onQRCode: ${error.message}`);
        }
      },

      onConnected: async () => {
        try {
          this.logger.debug(`Sessão ${sessionId} conectada`);
          await this.stateService.updateSessionStatus(
            sessionId,
            SessionStatus.CONNECTED,
          );
          if (
            safeCallbacks.onConnected &&
            typeof safeCallbacks.onConnected === 'function'
          ) {
            await safeCallbacks.onConnected(sessionId);
          }
        } catch (error) {
          this.logger.error(`Erro no handler onConnected: ${error.message}`);
        }
      },

      onDisconnected: async () => {
        try {
          this.logger.debug(`Sessão ${sessionId} desconectada`);
          await this.stateService.updateSessionStatus(
            sessionId,
            SessionStatus.DISCONNECTED,
          );
          if (
            safeCallbacks.onDisconnected &&
            typeof safeCallbacks.onDisconnected === 'function'
          ) {
            await safeCallbacks.onDisconnected(sessionId);
          }
        } catch (error) {
          this.logger.error(`Erro no handler onDisconnected: ${error.message}`);
        }
      },
    };

    // Registra os handlers no gerenciador de conexão
    await this.connectionManager.registerEventHandlers(
      sessionId,
      eventHandlers,
    );

    // Armazena função de cleanup para remoção posterior
    this.eventHandlers.set(sessionId, () => {
      this.connectionManager.unregisterEventHandlers(sessionId);
    });
  }
}
