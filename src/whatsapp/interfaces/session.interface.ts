import { SessionStatus } from '../constants/whatsapp.constants';
import { WASocket } from '@whiskeysockets/baileys';

/**
 * Interface que representa uma sessão do WhatsApp
 */
export interface Session {
  /**
   * Identificador único da sessão
   */
  id: string;

  /**
   * Socket de conexão com a API do WhatsApp
   * Pode ser indefinido durante a inicialização da sessão
   */
  socket?: WASocket;

  /**
   * Indica se a sessão está conectada ao WhatsApp
   * true = conectada, false = desconectada ou em processo de conexão
   */
  isConnected: boolean;

  /**
   * String do QR Code para autenticação
   * Disponível apenas durante o processo de pareamento
   */
  qr?: string;
}

/**
 * Interface que representa informações de estado de uma sessão
 */
export interface SessionInfo {
  /**
   * Identificador único da sessão
   */
  id: string;

  /**
   * Indica se a sessão está conectada ao WhatsApp
   */
  isConnected: boolean;

  /**
   * Data de criação da sessão
   */
  createdAt: Date;

  /**
   * QR Code para autenticação (opcional)
   */
  qr?: string;
}
