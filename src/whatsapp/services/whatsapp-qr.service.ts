import * as qrcode from 'qrcode-terminal';

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SessionNotFoundException, WhatsAppException } from '../exceptions/whatsapp.exception';

import { IWhatsAppSessionData } from '../interfaces/whatsapp-session.interface';

@Injectable()
export class WhatsAppQRService {
  private readonly logger = new Logger(WhatsAppQRService.name);

  /**
   * Obtém e gera o QR Code de uma sessão
   * @param sessionId ID da sessão
   * @param session Dados da sessão
   * @returns QR Code da sessão
   */
  async getQRCode(sessionId: string, session: IWhatsAppSessionData): Promise<string> {
    this.logger.debug(`Obtendo QR Code da sessão: ${sessionId}`);

    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    if (session.connected) {
      throw new WhatsAppException(
        'Não é possível gerar QR Code para uma sessão já conectada',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!session.qrCode) {
      throw new WhatsAppException(
        'QR Code ainda não está disponível',
        HttpStatus.NOT_FOUND
      );
    }

    qrcode.generate(session.qrCode, { small: true });
    return session.qrCode;
  }
}