import { Injectable, Logger } from '@nestjs/common';
import {
  SessionInfoDto,
  SessionStatusResponseDto,
  SessionsListResponseDto,
} from '../../dto/responses/session-response.dto';

import { ConnectionState } from '../../types';
import { ConnectionStateService } from '../connection/connection-state.service';
import { CreateSessionDto } from '../../dto/requests/create-session.dto';
import { SessionError } from '../../errors/whatsapp.error';
import { SessionInfo } from '../../interfaces/session.interface';
import { SessionStatus } from '../../constants/whatsapp.constants';

export { SessionStatus };

@Injectable()
export class SessionStateService {
  private readonly logger = new Logger(SessionStateService.name);
  private readonly sessions = new Map<string, SessionInfo>();
  private readonly sessionStates = new Map<string, SessionStatus>();

  async createSession(
    sessionId: string,
    options?: CreateSessionDto['options'],
  ): Promise<SessionInfo> {
    this.logger.log(`Criando estado para sessão: ${sessionId}`);

    try {
      const session: SessionInfo = {
        id: sessionId,
        isConnected: true,
        createdAt: new Date(),
      };

      this.sessionStates.set(sessionId, SessionStatus.CONNECTED);
      this.sessions.set(sessionId, session);
      this.sessionStates.set(sessionId, SessionStatus.CONNECTED);
      return session;
    } catch (error) {
      this.logger.error(
        `Erro ao criar estado da sessão ${sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao criar estado da sessão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Verifica se uma sessão existe
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    return this.sessions.has(sessionId);
  }

  /**
   * Obtém o status de uma sessão
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    this.logger.debug(`Obtendo status da sessão ${sessionId}`);
    const status = this.sessionStates.get(sessionId);

    if (!status) {
      return SessionStatus.DISCONNECTED;
    }

    return status;
  }

  /**
   * Atualiza o status de uma sessão
   */
  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
  ): Promise<void> {
    this.logger.debug(
      `Atualizando status da sessão ${sessionId} para ${status}`,
    );
    this.sessionStates.set(sessionId, status);
  }

  /**
   * Limpa o estado de uma sessão
   */
  async clearSessionState(sessionId: string): Promise<void> {
    this.logger.debug(`Limpando estado da sessão ${sessionId}`);
    this.sessions.delete(sessionId);
    this.sessionStates.delete(sessionId);
  }

  /**
   * Obtém informações completas de uma sessão
   */
  async getSessionInfo(sessionId: string): Promise<SessionStatusResponseDto> {
    const status = await this.getSessionStatus(sessionId);

    return {
      success: true,
      sessionId,
      status,
    };
  }

  /**
   * Obtém todas as sessões ativas
   */
  async getAllSessions(): Promise<SessionsListResponseDto> {
    const sessionsData: SessionInfoDto[] = Array.from(
      this.sessions.entries(),
    ).map(([sessionId, session]) => ({
      sessionId,
      status: this.sessionStates.get(sessionId) || SessionStatus.DISCONNECTED,
    }));

    return {
      success: true,
      count: sessionsData.length,
      sessions: sessionsData,
    };
  }

  async getSessionQRCode(sessionId: string): Promise<string | null> {
    this.logger.debug(`Obtendo QR code da sessão ${sessionId}`);
    const status = await this.getSessionStatus(sessionId);

    if (status !== SessionStatus.CONNECTING) {
      return null;
    }

    // Implementação para obter o QR code
    // Retornar o QR code ou null se não estiver disponível
    return 'QR_CODE_PLACEHOLDER';
  }

  async listSessions(): Promise<string[]> {
    this.logger.debug('Listando todas as sessões');
    return Array.from(this.sessions.keys());
  }
}
