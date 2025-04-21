import { WASocket } from '@whiskeysockets/baileys';

/**
 * Interface que define a estrutura de uma sessão do WhatsApp
 */
export interface IWhatsAppSessionData {
  /** Instância do socket do WhatsApp */
  sock: WASocket;
  /** Indica se a sessão está conectada */
  connected: boolean;
  /** QR Code para autenticação (opcional) */
  qrCode?: string;
}