import { Injectable, Logger } from '@nestjs/common';
import { SignalDataTypeMap } from '@whiskeysockets/baileys';
import { SignalStoreManager } from './interfaces/signal-store.interface';
import { RedisStorageService } from './redis-storage.service';

@Injectable()
export class SignalStoreService implements SignalStoreManager {
  private readonly logger = new Logger(SignalStoreService.name);

  constructor(private readonly redisStorage: RedisStorageService) {}

  createSignalKeyStore(sessionId: string) {
    const saveSingleKey = async (key: string, data: any) => {
      await this.redisStorage.writeData(sessionId, `key:${key}`, data);
    };

    const getSingleKey = async (key: string) => {
      return await this.redisStorage.readData(sessionId, `key:${key}`);
    };

    const removeSingleKey = async (key: string) => {
      await this.redisStorage.removeData(sessionId, `key:${key}`);
    };

    return {
      async get<T extends keyof SignalDataTypeMap>(
        type: T,
        ids: string[],
      ): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
        this.logger.debug(
          `Buscando ${ids.length} chaves do tipo ${String(type)} para sessão ${sessionId}`,
        );

        const data: { [id: string]: SignalDataTypeMap[typeof type] } = {};

        await Promise.all(
          ids.map(async (id) => {
            const key = `${type}:${id}`;
            const value = await getSingleKey(key);
            if (value) {
              data[id] = value;
            }
          }),
        );

        return data;
      },

      async set<T extends keyof SignalDataTypeMap>(
        type: T,
        id: string,
        value: SignalDataTypeMap[T],
      ): Promise<void> {
        this.logger.debug(
          `Salvando chave ${String(type)}:${id} para sessão ${sessionId}`,
        );

        const key = `${type}:${id}`;
        await saveSingleKey(key, value);
      },

      async clear<T extends keyof SignalDataTypeMap>(
        type: T,
        ids: string[],
      ): Promise<void> {
        this.logger.debug(
          `Limpando ${ids.length} chaves do tipo ${String(type)} para sessão ${sessionId}`,
        );

        await Promise.all(
          ids.map(async (id) => {
            const key = `${type}:${id}`;
            await removeSingleKey(key);
          }),
        );
      },
    };
  }
}
