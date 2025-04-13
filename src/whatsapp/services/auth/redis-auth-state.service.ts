import { Injectable, Logger } from '@nestjs/common';
import { AuthenticationCreds } from '@whiskeysockets/baileys';
import { CredentialsManagerService } from './credentials-manager.service';
import { SignalStoreService } from './signal-store.service';
import { RedisStorageService } from './redis-storage.service';

@Injectable()
export class RedisAuthStateService {
  private readonly logger = new Logger(RedisAuthStateService.name);

  constructor(
    private readonly credentialsManager: CredentialsManagerService,
    private readonly signalStoreManager: SignalStoreService,
    private readonly redisStorage: RedisStorageService,
  ) {}

  async loadState(sessionId: string): Promise<AuthenticationCreds | null> {
    try {
      return await this.credentialsManager.loadCredentials(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao carregar estado da sessão ${sessionId}: ${error.message}`,
      );
      return null;
    }
  }

  async saveState(
    sessionId: string,
    state: AuthenticationCreds,
  ): Promise<void> {
    try {
      await this.credentialsManager.saveCredentials(sessionId, state);
    } catch (error) {
      this.logger.error(
        `Erro ao salvar estado da sessão ${sessionId}: ${error.message}`,
      );
      throw error;
    }
  }

  async removeState(sessionId: string): Promise<void> {
    try {
      await this.redisStorage.clearSessionData(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao remover estado da sessão ${sessionId}: ${error.message}`,
      );
      throw error;
    }
  }

  async useRedisAuthState(sessionId: string) {
    const creds = await this.loadState(sessionId);
    const saveCreds = async (authData: AuthenticationCreds) =>
      await this.saveState(sessionId, authData);
    const signalKeyStore =
      this.signalStoreManager.createSignalKeyStore(sessionId);
    const clearState = async () => {
      await this.removeState(sessionId);
    };

    return {
      state: creds,
      saveCreds,
      clearState,
      keys: signalKeyStore,
    };
  }

  /**
   * Lista todas as sessões disponíveis
   */
  async listSessions(): Promise<string[]> {
    try {
      // Ler lista de sessões de uma chave especial no Redis
      const sessionsData =
        (await this.redisStorage.readData('system', 'sessions')) || [];
      return sessionsData;
    } catch (error) {
      this.logger.error(`Erro ao listar sessões: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove dados de autenticação de uma sessão
   */
  async clearAuth(sessionId: string): Promise<void> {
    try {
      // Usar o método existente para limpar dados da sessão
      await this.redisStorage.clearSessionData(sessionId);
      this.logger.debug(
        `Dados de autenticação removidos para sessão ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao limpar dados de auth: ${error.message}`);
      throw error;
    }
  }
}
