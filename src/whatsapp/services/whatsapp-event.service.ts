import * as qrcode from 'qrcode-terminal';

import { Injectable, Logger } from '@nestjs/common';

import { IWhatsAppSessionData } from '../interfaces/whatsapp-session.interface';
import { MessageService } from './message.service';
import { WASocket } from '@whiskeysockets/baileys';

@Injectable()
export class WhatsAppEventService {
  private readonly logger = new Logger(WhatsAppEventService.name);

  /**
   * Configura o listener de QR Code
   */
  setupQRCodeListener(
    sock: WASocket,
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void,
    firstQR: { value: boolean }
  ): void {
    sock.ev.on('connection.update', ({ qr }) => {
      if (qr && firstQR.value) {
        this.logger.log(`Novo QR Code gerado para sessão ${sessionId}`);
        qrcode.generate(qr, { small: true });
        firstQR.value = false;
        onUpdate({ qrCode: qr });
      }
    });
  }

  /**
   * Configura o listener de credenciais
   */
  setupCredentialsListener(
    sock: WASocket,
    sessionId: string,
    saveCreds: () => Promise<void>
  ): void {
    sock.ev.on('creds.update', async () => {
      try {
        await saveCreds();
        this.logger.debug(`Credenciais atualizadas para sessão ${sessionId}`);
      } catch (error) {
        this.logger.error(`Erro ao salvar credenciais da sessão ${sessionId}: ${error.message}`);
        // Tenta salvar novamente após um delay
        setTimeout(async () => {
          try {
            await saveCreds();
          } catch (retryError) {
            this.logger.error(`Falha na segunda tentativa de salvar credenciais: ${retryError.message}`);
          }
        }, 5000);
      }
    });
  }

  /**
   * Configura o listener de estado da conexão
   */
  setupConnectionStateListener(
    sock: WASocket,
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void
  ): void {
    sock.ev.on('connection.update', ({ connection }) => {
      if (connection === 'open') {
        this.logger.log(`Sessão ${sessionId} conectada com sucesso`);
        onUpdate({ connected: true, qrCode: undefined });
      }
    });
  }

  /**
   * Configura o listener de mensagens recebidas
   */
  setupMessageListener(
    sock: WASocket,
    sessionId: string,
    messageService: MessageService
    
  ): void {
    sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
        // Ignora mensagens enviadas por nós mesmos
        if (message.key.fromMe) continue;

        this.logger.log(`Nova mensagem recebida na sessão ${sessionId}`);

        try {
          // Extrai o conteúdo da mensagem
          const messageContent = message.message?.conversation || 
                               message.message?.extendedTextMessage?.text ||
                               JSON.stringify(message.message);

          // Persiste a mensagem recebida
          await messageService.saveMessage({
            sessionId,
            remoteJid: message.key.remoteJid,
            fromMe: false,
            messageType: 'text',
            content: messageContent,
            quotedMessageId: message.message?.extendedTextMessage?.contextInfo?.stanzaId || null
          });

          this.logger.debug(`Mensagem recebida salva com sucesso para sessão ${sessionId}`);
        } catch (error) {
          this.logger.error(`Erro ao salvar mensagem recebida: ${error.message}`);
        }
      }
    });
  }
}