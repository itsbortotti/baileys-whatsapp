/**
 * WhatsApp Integration Module
 *
 * Este arquivo centraliza todas as exportações do módulo WhatsApp,
 * facilitando as importações em outros módulos da aplicação.
 */

// Módulo principal
export { WhatsappModule } from './whatsapp.module';

// Controllers
export { WhatsappSessionController } from './controllers/session/whatsapp-session.controller';
export { TextMessageController as WhatsappMessageController } from './controllers/message/text-message.controller';
export { CleanupController as WhatsappMaintenanceController } from './controllers/maintenance/cleanup.controller';

// Serviços
export { WhatsappSessionService } from './services/session/whatsapp-session.service';
export { WhatsappMessageService } from './services/message/whatsapp-message.service';
export { WhatsappConnectionService } from './services/connection/whatsapp-connection.service';
export { RedisAuthStateService } from './services/auth/redis-auth-state.service';

// Interfaces e tipos
export { Session } from './interfaces/session.interface';
export { BoomError, BoomErrorOutput } from './types/boom-error.interface';
export { ConnectionState as ReconnectionState } from '@whiskeysockets/baileys';
export { SendMessageResponseDto as MessageResult } from './dto/responses/message-response.dto';

// DTOs
export { SendMessageDto, SendImageDto } from './dto';

// Constantes
export {
  WA_VERSION,
  ERROR_CODES,
  CONNECTION_CONFIG,
  PAIRING_FLAG,
  FILE_PATHS,
} from './constants/whatsapp.constants';

// Utilitários
export {
  generateQRCode,
  getQRCodeEndpoints,
  logQRCodeInfo,
  QRCodeDisplayOptions,
  QRCodeResult,
} from './utils/qr-code.util';

export {
  getBrowserConfig,
  detectOS,
  SupportedOS,
  BrowserConfig,
} from './utils/browser-config.util';

export {
  cleanSessionFiles,
  cleanAllSessionFiles,
  cleanRedisSessionData,
  cleanSession,
  checkSessionFilesIntegrity,
  CleanupResult,
} from './utils/session-cleaner.util';
