export interface Connection {
  state: ConnectionState;
  qrCode?: string;
  close(): Promise<void>;
}

export interface ConnectionInfo {
  sessionId: string;
  status: ConnectionState;
  createdAt: Date;
}

export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface SessionInfo {
  sessionId: string;
  status: ConnectionState;
  createdAt: Date;
}
