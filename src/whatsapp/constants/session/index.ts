/**
 * Constantes relacionadas ao gerenciamento de sessões
 */

export const SESSION_CONSTANTS = {
  // Timeouts
  CONNECTION_TIMEOUT: 60000,
  RECONNECT_INTERVAL: 5000,
  QR_CODE_TIMEOUT: 30000,

  // Status
  SESSION_STATUS: {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
  },

  // Eventos
  SESSION_EVENTS: {
    QR_RECEIVED: 'qr',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
  },
};
