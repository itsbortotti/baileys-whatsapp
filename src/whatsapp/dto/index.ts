// DTOs de requisição
export {
  CreateSessionDto,
  SessionOptions,
  SessionCallbacks,
} from './requests/create-session.dto';

export { SendMessageDto } from './requests/send-message.dto';

export { SendImageDto } from './requests/send-image.dto';

// DTOs de resposta
export {
  SessionStatusResponseDto,
  CreateSessionResponseDto,
  QrCodeResponseDto,
  SessionsListResponseDto,
  SessionInfoDto,
  DisconnectSessionResponseDto,
} from './responses/session-response.dto';

export {
  ServiceStatusResponseDto,
  CleanFilesResponseDto,
  MaintenanceErrorResponseDto,
} from './responses/maintenance-response.dto';

export {
  SendMessageResponseDto,
  SendImageResponseDto,
  MessageErrorResponseDto,
} from './responses/message-response.dto';
