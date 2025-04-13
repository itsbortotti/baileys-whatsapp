import { Injectable, Logger } from '@nestjs/common';
import {
  AuthenticationCreds,
  SignalDataTypeMap,
  SignedKeyPair,
  KeyPair,
  generateRegistrationId,
  Curve,
  proto,
} from '@whiskeysockets/baileys';
import { RedisStorageService } from './redis-storage.service';

@Injectable()
export class CredentialsManagerService {
  private readonly logger = new Logger(CredentialsManagerService.name);

  constructor(private readonly redisStorage: RedisStorageService) {}

  async loadCredentials(sessionId: string): Promise<AuthenticationCreds> {
    this.logger.debug(`Carregando credenciais para sessão ${sessionId}`);

    const creds = await this.redisStorage.readData(sessionId, 'creds');

    if (!creds) {
      this.logger.debug(
        `Nenhuma credencial encontrada para sessão ${sessionId}, criando padrão`,
      );
      return this.createEmptyCredentials();
    }

    return creds;
  }

  async saveCredentials(
    sessionId: string,
    creds: AuthenticationCreds,
  ): Promise<void> {
    this.logger.debug(
      `Salvando credenciais atualizadas para sessão ${sessionId}`,
    );
    await this.redisStorage.writeData(sessionId, 'creds', creds);
  }

  createSaveCredentialsCallback(
    sessionId: string,
    creds: AuthenticationCreds,
  ): () => Promise<void> {
    return async () => {
      this.logger.debug(
        `Callback de salvamento executado para sessão ${sessionId}`,
      );
      await this.saveCredentials(sessionId, creds);
    };
  }

  private createEmptyKeyPair(): KeyPair {
    return {
      public: Uint8Array.from([]),
      private: Uint8Array.from([]),
    };
  }

  /**
   * Cria credenciais vazias para uma nova sessão
   */
  async createEmptyCredentials(): Promise<AuthenticationCreds> {
    // Gera credenciais novas quando não existem para a sessão
    const identityKey = Curve.generateKeyPair();
    const noiseKey = Curve.generateKeyPair();
    const signedPreKey = {
      keyPair: Curve.generateKeyPair(),
      signature: new Uint8Array(),
      keyId: 1,
    };
    const registrationId = generateRegistrationId();

    const creds: Partial<AuthenticationCreds> = {
      noiseKey,
      signedIdentityKey: identityKey,
      signedPreKey,
      registrationId,
      advSecretKey: '',
      nextPreKeyId: 1,
      firstUnuploadedPreKeyId: 1,
      account: undefined,
      me: { id: '' },
      signalIdentities: [
        {
          identifier: {
            name: '',
            deviceId: 0,
          },
          identifierKey: identityKey.public,
        },
      ],
      platform: '',
      myAppStateKeyId: '',
      processedHistoryMessages: [],
      accountSettings: {
        unarchiveChats: false,
      },
      accountSyncCounter: 0,
      // Remover deviceId pois não faz parte do tipo AuthenticationCreds
    };

    return creds as AuthenticationCreds;
  }
}
