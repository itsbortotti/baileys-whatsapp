import { Module } from '@nestjs/common';

// Auth Services
import {
  RedisAuthStateService,
  AuthManagerService,
  RedisStorageService,
  CredentialsManagerService,
  SignalStoreService,
} from './services/auth';

// Connection Services
import {
  WhatsappConnectionService,
  ConnectionManagerService,
  ConnectionStateService,
  ConnectionEventsService,
} from './services/connection';

// Message Services
import {
  WhatsappMessageService,
  TextMessageService,
  MediaMessageService,
  MessageQueueService,
  MessageValidatorService,
} from './services/message';

// Session Services
import {
  WhatsappSessionService,
  SessionManagerService,
  SessionStateService,
  SessionEventsService,
} from './services/session';

// Controllers
import {
  TextMessageController,
  MediaMessageController,
} from './controllers/message';
import {
  // TODO: organizar imports
  SessionQRController,
  SessionStatusController,
  SessionManagementController,
} from './controllers/session';
import {
  SystemStatusController,
  CleanupController,
} from './controllers/maintenance';

@Module({
  controllers: [
    SessionQRController,
    SessionStatusController,
    SessionManagementController,
    TextMessageController,
    MediaMessageController,
    SystemStatusController,
    CleanupController,
  ],
  providers: [
    // Auth Services
    RedisAuthStateService,
    AuthManagerService,
    RedisStorageService,
    CredentialsManagerService,
    SignalStoreService,

    // Connection Services
    WhatsappConnectionService,
    ConnectionManagerService,
    ConnectionStateService,
    ConnectionEventsService,

    // Message Services
    WhatsappMessageService,
    TextMessageService,
    MediaMessageService,
    MessageQueueService,
    MessageValidatorService,

    // Session Services
    WhatsappSessionService,
    SessionManagerService,
    SessionStateService,
    SessionEventsService,
  ],
  exports: [
    WhatsappSessionService,
    WhatsappMessageService,
    WhatsappConnectionService,
    AuthManagerService,
  ],
})
export class WhatsappModule {}
