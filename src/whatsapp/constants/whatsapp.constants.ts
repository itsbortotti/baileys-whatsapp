import { ConnectionState } from '@whiskeysockets/baileys';

// Tipos de conexão como strings para evitar problemas de tipo
export const CONNECTION_STATES = {
  OPEN: 'open',
  CLOSE: 'close',
  CONNECTING: 'connecting',
  REFUSED: 'refused',
} as const;

export type ConnectionStateType = string;
export type SessionStatusType = keyof typeof SessionStatus;

export const FILE_PATHS = {
  SESSIONS_DIR: 'sessions',
  AUTH_FILE: 'auth_info.json',
  STATE_FILE: 'state.json',
  STORE_FILE: 'store.json',
  TEMP_DIR: 'temp',
} as const;

export const WA_VERSION = {
  CHROME: {
    WINDOWS: '2.2424.8',
    MAC: '2.2424.11',
    LINUX: '2.2424.10',
  },
  MIN_SUPPORTED: '2.2308.7',
};

export const ERROR_CODES = {
  DEVICE_REMOVED: '401',
  RESTART_REQUIRED: '515',
  CONNECTION_CLOSED: '428',
  METHOD_NOT_ALLOWED: '405',
  UNAUTHORIZED: '401',
  CONFLICT: 'conflict',
};

export const CONNECTION_CONFIG = {
  TIMEOUT_MS: 60000,
  INITIAL_RECONNECT_DELAY_MS: 5000,
  RETRY_DELAY_515: 10000,
  MAX_RECONNECT_ATTEMPTS: 5,
  MAX_RETRIES_515: 3,
  printQRInTerminal: false,
  browser: ['Chrome', WA_VERSION.CHROME.WINDOWS, 'Windows'],
  auth: undefined,
};

export const REDIS_CONFIG = {
  KEY_PREFIX: 'whatsapp:',
  EXPIRATION: 24 * 60 * 60,
};

// Estados da sessão para nossa aplicação
export enum SessionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  FAILED = 'failed',
}

export const SESSION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  FAILED: 'failed',
} as const;

export const ERROR_MESSAGES = {
  SESSION: {
    NOT_FOUND: 'Sessão não encontrada',
    ALREADY_EXISTS: 'Sessão já existe',
    CREATION_FAILED: 'Falha ao criar sessão',
    DELETION_FAILED: 'Falha ao deletar sessão',
  },
  CONNECTION: {
    FAILED: 'Falha na conexão',
    TIMEOUT: 'Tempo limite de conexão excedido',
  },
  VALIDATION: {
    INVALID_PHONE: 'Número de telefone inválido',
    INVALID_MESSAGE: 'Mensagem inválida',
  },
};

export const PAIRING_FLAG = 'isPairingInProgress';

// O tipo SessionStatus já está definido como enum acima
