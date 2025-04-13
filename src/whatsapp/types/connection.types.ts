import { ConnectionState as AppConnectionState } from '../types';
import { ConnectionState as BaileysConnectionState } from '@whiskeysockets/baileys';

// Tipo que representa os estados possíveis do Baileys
export type WhatsAppConnectionState = AppConnectionState;

// Mapeamento entre os estados da aplicação e os estados do Baileys
const APP_TO_BAILEYS_MAP = {
  CONNECTING: 'connecting',
  CONNECTED: 'open',
  DISCONNECTED: 'close',
  ERROR: 'close', // Baileys não tem estado ERROR, mapeamos para close
} as const;

const BAILEYS_TO_APP_MAP = {
  connecting: 'CONNECTING',
  open: 'CONNECTED',
  close: 'DISCONNECTED',
} as const;

// Definição de tipo para garantir compatibilidade com o Baileys
export type ConnectionStateType = {
  connection: 'connecting' | 'open' | 'close';
  lastDisconnect?: {
    error?: Error;
    date?: Date;
  };
  receivedPendingNotifications?: boolean;
  isNewLogin?: boolean;
  qr?: string;
};

// Função para converter nosso tipo para o tipo do Baileys
export function toBaileysConnectionState(
  state: WhatsAppConnectionState,
): BaileysConnectionState {
  return {
    connection: APP_TO_BAILEYS_MAP[state] || 'close',
  };
}

// Função para converter o tipo do Baileys para o nosso tipo
export function fromBaileysConnectionState(
  state: BaileysConnectionState,
): WhatsAppConnectionState {
  switch (state.connection) {
    case 'connecting':
      return AppConnectionState.CONNECTING;
    case 'open':
      return AppConnectionState.CONNECTED;
    case 'close':
    default:
      return AppConnectionState.DISCONNECTED;
  }
}

// Interface para informações da conexão
export interface ConnectionInfo {
  state: WhatsAppConnectionState;
  createdAt: Date;
}
