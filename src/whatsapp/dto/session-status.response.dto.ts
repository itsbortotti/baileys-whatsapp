import { ConnectionState } from '../types';

export class SessionStatusResponseDto {
  sessionId: string;
  status: ConnectionState;
  qrCode?: string;
  createdAt: Date;
}
