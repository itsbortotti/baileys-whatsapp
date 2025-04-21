import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, { DisconnectReason, WASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import { IWhatsAppSessionData } from '../interfaces/whatsapp-session.interface';
import { join } from 'path';

@Injectable()
export class WhatsAppConnectionService {
  private readonly logger = new Logger(WhatsAppConnectionService.name);

  /**
   * Cria uma nova conexão do WhatsApp
   * @param sessionId ID da sessão
   * @param onUpdate Callback para atualização de estado da conexão
   */
  async createConnection(
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void,
  ): Promise<IWhatsAppSessionData> {
    this.logger.log(`Iniciando criação de conexão para sessão: ${sessionId}`);

    const { state, saveCreds } = await useMultiFileAuthState(
      join(process.cwd(), 'sessions', sessionId)
    );

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    this.setupConnectionListeners(sock, sessionId, onUpdate, saveCreds);

    return { sock, connected: false };
  }

  /**
   * Configura os listeners de eventos da conexão
   */
  private setupConnectionListeners(
    sock: WASocket,
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void,
    saveCreds: () => Promise<void>,
  ): void {
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      this.logger.debug(`Atualização de conexão para sessão ${sessionId}: ${connection}`);

      if (qr) {
        this.logger.log(`Novo QR Code gerado para sessão ${sessionId}`);
        onUpdate({ qrCode: qr });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          this.logger.warn(`Reconectando sessão ${sessionId}...`);
          await this.createConnection(sessionId, onUpdate);
        } else {
          this.logger.warn(`Sessão ${sessionId} desconectada permanentemente`);
        }
      }

      if (connection === 'open') {
        this.logger.log(`Sessão ${sessionId} conectada com sucesso`);
        onUpdate({ connected: true });
      }
    });

    sock.ev.on('creds.update', saveCreds);
  }

  /**
   * Encerra uma conexão do WhatsApp
   */
  async closeConnection(sock: WASocket): Promise<void> {
    this.logger.log('Encerrando conexão do WhatsApp');
    sock.ev.removeAllListeners('connection.update');
    sock.ev.removeAllListeners('creds.update');
    await sock.end(undefined);
  }
}