import { Injectable, Logger } from '@nestjs/common';
import { AuthError } from '../../errors/whatsapp.error';
import { RedisAuthStateService } from './redis-auth-state.service';

/**
 * Serviço responsável pelo gerenciamento de autenticação
 * Coordena operações de autenticação e estado
 */
@Injectable()
export class AuthManagerService {
  private readonly logger = new Logger(AuthManagerService.name);

  constructor(private readonly redisAuthState: RedisAuthStateService) {}

  /**
   * Inicia o processo de autenticação
   */
  async startAuth(sessionId: string): Promise<void> {
    this.logger.log(`Iniciando autenticação para sessão: ${sessionId}`);

    try {
      // Verificar estado existente
      const existingState = await this.redisAuthState.loadState(sessionId);
      if (existingState) {
        this.logger.log(
          `Estado de autenticação existente encontrado para sessão ${sessionId}`,
        );
        // Implementar lógica de restauração de estado
      }
    } catch (error) {
      this.logger.error(
        `Erro ao iniciar autenticação para sessão ${sessionId}: ${error.message}`,
      );
      throw new AuthError('Falha ao iniciar autenticação', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Finaliza a autenticação e salva o estado
   */
  async completeAuth(sessionId: string, authData: any): Promise<void> {
    this.logger.log(`Completando autenticação para sessão: ${sessionId}`);

    try {
      await this.redisAuthState.saveState(sessionId, authData);
    } catch (error) {
      this.logger.error(
        `Erro ao completar autenticação para sessão ${sessionId}: ${error.message}`,
      );
      throw new AuthError('Falha ao completar autenticação', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Remove dados de autenticação
   */
  async clearAuth(sessionId: string): Promise<void> {
    this.logger.log(`Removendo dados de autenticação da sessão: ${sessionId}`);

    try {
      await this.redisAuthState.removeState(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao remover autenticação da sessão ${sessionId}: ${error.message}`,
      );
      throw new AuthError('Falha ao remover autenticação', {
        sessionId,
        originalError: error.message,
      });
    }
  }
}
