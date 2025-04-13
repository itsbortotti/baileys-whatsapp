export interface RedisStorage {
  writeData(sessionId: string, key: string, data: any): Promise<void>;

  readData(sessionId: string, key: string): Promise<any>;

  removeData(sessionId: string, key: string): Promise<void>;

  clearSessionData(sessionId: string): Promise<void>;
}
