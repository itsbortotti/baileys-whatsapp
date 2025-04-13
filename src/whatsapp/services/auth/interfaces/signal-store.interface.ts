import { SignalDataTypeMap } from '@whiskeysockets/baileys';

export interface SignalStoreManager {
  createSignalKeyStore(sessionId: string): {
    get: <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[],
    ) => Promise<{ [id: string]: SignalDataTypeMap[T] }>;

    set: <T extends keyof SignalDataTypeMap>(
      type: T,
      id: string,
      value: SignalDataTypeMap[T],
    ) => Promise<void>;

    clear: <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[],
    ) => Promise<void>;
  };
}
