import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

import { FILE_PATHS } from '../constants/whatsapp.constants';
import { RedisStorageService } from '../services/auth/redis-storage.service';

export interface CleanupResult {
  success: boolean;
  message: string;
  details?: { sessionId: string };
  error?: any;
}

/**
 * Limpa diretórios e arquivos da sessão especificada
 */
export const cleanSessionFiles = async (sessionId: string): Promise<void> => {
  const sessionsDir = path.join(
    process.cwd(),
    FILE_PATHS.SESSIONS_DIR,
    sessionId,
  );

  if (fs.existsSync(sessionsDir)) {
    const files = fs.readdirSync(sessionsDir);

    for (const file of files) {
      fs.unlinkSync(path.join(sessionsDir, file));
    }

    fs.rmdirSync(sessionsDir);
  }
};

/**
 * Limpa diretórios e arquivos de todas as sessões
 */
export const cleanAllSessionFiles = async (): Promise<void> => {
  const sessionsDir = path.join(process.cwd(), FILE_PATHS.SESSIONS_DIR);

  if (fs.existsSync(sessionsDir)) {
    const sessions = fs.readdirSync(sessionsDir);

    for (const sessionId of sessions) {
      await cleanSessionFiles(sessionId);
    }
  }
};

/**
 * Limpa os dados da sessão armazenados no Redis
 */
export const cleanRedisSessionData = async (
  sessionId: string,
): Promise<void> => {
  const redisStorage = new RedisStorageService();
  await redisStorage.clearSessionData(sessionId);
};

/**
 * Remove todos os dados relacionados a uma sessão (arquivos e dados no Redis)
 */
export const cleanSession = async (
  sessionId: string,
): Promise<CleanupResult> => {
  const logger = new Logger('SessionCleaner');
  logger.debug(`Iniciando limpeza da sessão ${sessionId}`);

  try {
    await cleanSessionFiles(sessionId);
    await cleanRedisSessionData(sessionId);

    logger.debug(`Sessão ${sessionId} limpa com sucesso`);
    return {
      success: true,
      message: `Sessão ${sessionId} limpa com sucesso`,
      details: { sessionId },
    };
  } catch (error) {
    logger.error(`Erro ao limpar sessão ${sessionId}: ${error.message}`);
    return {
      success: false,
      message: `Falha ao limpar sessão ${sessionId}`,
      error,
    };
  }
};

/**
 * Verifica a integridade dos arquivos de uma sessão
 */
export const checkSessionFilesIntegrity = (
  sessionId: string,
): { isValid: boolean; corruptedFiles: string[] } => {
  const logger = new Logger('SessionCleaner');
  const sessionsDir = path.join(process.cwd(), FILE_PATHS.SESSIONS_DIR);
  const sessionDir = path.join(sessionsDir, sessionId);

  const result = {
    isValid: true,
    corruptedFiles: [] as string[],
  };

  if (!fs.existsSync(sessionDir)) {
    logger.debug(`Diretório da sessão ${sessionId} não encontrado`);
    return result;
  }

  const files = fs.readdirSync(sessionDir);
  logger.debug(`Verificando ${files.length} arquivos da sessão ${sessionId}`);

  for (const file of files) {
    const filePath = path.join(sessionDir, file);

    try {
      const stats = fs.statSync(filePath);

      if (stats.size === 0) {
        logger.warn(`Arquivo vazio encontrado: ${file}`);
        result.isValid = false;
        result.corruptedFiles.push(file);
        continue;
      }

      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content);
        } catch (jsonError) {
          logger.warn(`Arquivo JSON inválido: ${file}`);
          result.isValid = false;
          result.corruptedFiles.push(file);
        }
      }
    } catch (fileError) {
      logger.error(`Erro ao acessar arquivo ${file}: ${fileError.message}`);
      result.isValid = false;
      result.corruptedFiles.push(file);
    }
  }

  if (!result.isValid) {
    logger.warn(
      `Encontrados ${result.corruptedFiles.length} arquivos corrompidos na sessão ${sessionId}`,
    );
  } else {
    logger.debug(
      `Verificação de integridade concluída com sucesso para sessão ${sessionId}`,
    );
  }

  return result;
};
