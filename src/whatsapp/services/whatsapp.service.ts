import { Injectable, Logger } from '@nestjs/common';
import { SessionAlreadyExistsException, SessionNotFoundException } from '../exceptions/whatsapp.exception';
import { SessionsList, WhatsappSession } from '../interfaces/session.interface';

import { IWhatsAppSessionData } from '../interfaces/whatsapp-session.interface';
import { WhatsAppConnectionService } from './whatsapp-connection.service';

@Injectable()
export class WhatsappService {
  private sessions: Map<string, IWhatsAppSessionData> = new Map();
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly connectionService: WhatsAppConnectionService) {}

  /**
   * Cria uma nova sessão do WhatsApp
   * @param sessionId ID único da sessão
   * @returns Informações da sessão criada
   */
  async createSession(sessionId: string): Promise<WhatsappSession> {
    this.logger.log(`Criando nova sessão: ${sessionId}`);

    if (this.sessions.has(sessionId)) {
      throw new SessionAlreadyExistsException(sessionId);
    }

    const sessionData = await this.connectionService.createConnection(
      sessionId,
      (update) => {
        const currentSession = this.sessions.get(sessionId);
        if (currentSession) {
          this.sessions.set(sessionId, { ...currentSession, ...update });
        }
      }
    );

    this.sessions.set(sessionId, sessionData);
    return { sessionId, connected: false };
  }

  /**
   * Obtém o status de uma sessão
   * @param sessionId ID da sessão
   * @returns Status atual da sessão
   */
  async getSessionStatus(sessionId: string): Promise<WhatsappSession> {
    this.logger.debug(`Obtendo status da sessão: ${sessionId}`);
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    return {
      sessionId,
      connected: session.connected,
      qrCode: session.qrCode
    };
  }

  /**
   * Lista todas as sessões ativas
   * @returns Lista de sessões e contagem total
   */
  async listSessions(): Promise<SessionsList> {
    this.logger.debug('Listando todas as sessões');
    const sessions = Array.from(this.sessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      connected: session.connected
    }));

    return {
      count: sessions.length,
      sessions
    };
  }

  /**
   * Remove uma sessão existente
   * @param sessionId ID da sessão a ser removida
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.logger.log(`Removendo sessão: ${sessionId}`);
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    await this.connectionService.closeConnection(session.sock);
    this.sessions.delete(sessionId);
    this.logger.log(`Sessão ${sessionId} removida com sucesso`);
  }
}