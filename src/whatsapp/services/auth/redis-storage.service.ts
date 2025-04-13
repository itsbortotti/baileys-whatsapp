import { Injectable, Logger } from '@nestjs/common';
import redisClient from '../../../config/redis.config';

/**
 * Serviço de armazenamento Redis
 * Gerencia operações de leitura/escrita no Redis
 */
@Injectable()
export class RedisStorageService {
  private readonly logger = new Logger(RedisStorageService.name);
  private readonly prefix = 'whatsapp:storage:';

  /**
   * Escreve dados no Redis
   */
  async writeData(sessionId: string, key: string, data: any): Promise<void> {
    try {
      const fullKey = this.getFullKey(sessionId, key);
      await redisClient.set(fullKey, JSON.stringify(data));
      this.logger.debug(`Dados salvos no Redis: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Erro ao salvar dados no Redis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lê dados do Redis
   */
  async readData(sessionId: string, key: string): Promise<any> {
    try {
      const fullKey = this.getFullKey(sessionId, key);
      const data = await redisClient.get(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Erro ao ler dados do Redis: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove dados do Redis
   */
  async removeData(sessionId: string, key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(sessionId, key);
      await redisClient.del(fullKey);
      this.logger.debug(`Dados removidos do Redis: ${fullKey}`);
    } catch (error) {
      this.logger.error(`Erro ao remover dados do Redis: ${error.message}`);
      throw error;
    }
  }

  /**
   * Limpa todos os dados de uma sessão
   */
  async clearSessionData(sessionId: string): Promise<void> {
    try {
      const pattern = `${this.getSessionPrefix(sessionId)}:*`;
      let cursor = '0';

      do {
        // Usar o método SCAN do Redis corretamente
        // Corrigir chamada do scan para seguir a API esperada
        const scanResult = await redisClient.scan(parseInt(cursor) || 0, {
          MATCH: pattern,
          COUNT: 100,
        });

        // Desestruturar o resultado corretamente
        const nextCursor = scanResult.cursor.toString();
        const keys = scanResult.keys || [];

        cursor = nextCursor;

        if (keys.length > 0) {
          // Corrigir a chamada do método del para seguir a API correta
          await redisClient.del(keys);
          this.logger.debug(
            `Removidos ${keys.length} chaves da sessão ${sessionId}`,
          );
        }
      } while (cursor !== '0');

      this.logger.log(`Dados da sessão ${sessionId} limpos com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao limpar dados da sessão: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gera a chave completa para o Redis
   */
  private getFullKey(sessionId: string, key: string): string {
    return `${this.getSessionPrefix(sessionId)}:${key}`;
  }

  /**
   * Gera o prefixo da sessão
   */
  private getSessionPrefix(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }
}
