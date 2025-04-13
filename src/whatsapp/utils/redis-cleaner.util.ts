import { Logger } from '@nestjs/common';
import { RedisAuthStateService } from '../services/auth/redis-auth-state.service';

const logger = new Logger('RedisCleaner');

/**
 * Resultado de uma operação de limpeza do Redis
 */
export interface RedisCleanupResult {
  /** Se a operação foi bem-sucedida */
  success: boolean;
  /** Mensagem descritiva sobre a operação */
  message: string;
  /** Detalhes adicionais (opcional) */
  details?: Record<string, any>;
  /** Erro em caso de falha (opcional) */
  error?: Error;
}

/**
 * Limpa os dados de autenticação Redis para uma sessão
 * @param sessionId ID da sessão
 * @param redisAuthService Serviço de autenticação Redis
 * @returns Resultado da operação de limpeza
 */
export async function cleanRedisSessionData(
  sessionId: string,
  redisAuthService: RedisAuthStateService,
): Promise<RedisCleanupResult> {
  try {
    const { clearState } = await redisAuthService.useRedisAuthState(sessionId);
    await clearState();

    logger.log(`Dados de sessão removidos do Redis para ${sessionId}`);

    return {
      success: true,
      message: `Dados Redis limpos para sessão ${sessionId}`,
    };
  } catch (error) {
    logger.error(`Erro ao limpar dados de sessão no Redis: ${error.message}`);

    return {
      success: false,
      message: `Erro ao limpar dados Redis: ${error.message}`,
      error,
    };
  }
}
