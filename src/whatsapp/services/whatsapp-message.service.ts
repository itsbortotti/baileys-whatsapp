import { Injectable, Logger } from '@nestjs/common';

import { IMessageRequest } from '../interfaces/message-request.interface';
import { MessageService } from './message.service';
import { WASocket } from '@whiskeysockets/baileys';
import { WhatsAppException } from '../exceptions/whatsapp.exception';
import { delay } from '../utils/delay.util';

@Injectable()
export class WhatsAppMessageService {
  private readonly logger = new Logger(WhatsAppMessageService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 segundos

  constructor(private readonly messageService: MessageService) {}

  /**
   * Envia uma mensagem de texto com retry em caso de falha
   */
  async sendTextMessage(
    sock: WASocket, 
    messageRequest: IMessageRequest,
    sessionId: string
  ): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.MAX_RETRIES) {
      try {
        await this.validateConnection(sock);
        const result = await this.executeMessageSend(sock, messageRequest);
        await this.persistMessage(sessionId, messageRequest, result);
        return;
      } catch (error) {
        await this.handleSendError(error, ++attempts);
      }
    }
  }

  /**
   * Valida se a conexão está ativa
   */
  private validateConnection(sock: WASocket): void {
    if (!sock.user) {
      throw new WhatsAppException('Conexão não está ativa');
    }
  }

  /**
   * Executa o envio da mensagem
   */
  private async executeMessageSend(sock: WASocket, messageRequest: IMessageRequest) {
    this.logger.debug(`Enviando mensagem para: ${messageRequest.to}`);
    return await sock.sendMessage(messageRequest.to, {
      text: messageRequest.text
    });
  }

  /**
   * Persiste a mensagem no banco de dados
   */
  private async persistMessage(
    sessionId: string, 
    messageRequest: IMessageRequest, 
    result: any
  ): Promise<void> {
    await this.messageService.saveMessage({
      sessionId,
      remoteJid: messageRequest.to,
      fromMe: true,
      messageType: 'text',
      content: JSON.stringify({ text: messageRequest.text }),
      quotedMessageId: null
    });
    this.logger.log(`Mensagem enviada com sucesso para: ${messageRequest.to}`);
  }

  /**
   * Trata erros no envio da mensagem
   */
  private async handleSendError(error: any, attempts: number): Promise<void> {
    this.logger.error(`Erro ao enviar mensagem (tentativa ${attempts}): ${error.message}`);
    
    if (attempts === this.MAX_RETRIES) {
      throw new WhatsAppException(
        `Falha ao enviar mensagem após ${this.MAX_RETRIES} tentativas: ${error.message}`
      );
    }

    await delay(this.RETRY_DELAY);
  }
}