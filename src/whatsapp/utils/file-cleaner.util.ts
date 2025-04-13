import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { FILE_PATHS } from '../constants/whatsapp.constants';

const logger = new Logger('FileCleaner');

export interface FileCleanupResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  error?: Error;
}

export function ensureSessionsDirectory(): string {
  const sessionsDir = path.resolve(process.cwd(), FILE_PATHS.SESSIONS_DIR);

  try {
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
      logger.log(`Diretório de sessões criado: ${sessionsDir}`);
    }
    return sessionsDir;
  } catch (error) {
    logger.error(
      `Erro ao verificar/criar diretório de sessões: ${error.message}`,
    );
    throw error;
  }
}

export async function cleanSessionFiles(
  sessionId: string,
): Promise<FileCleanupResult> {
  const sessionsDir = ensureSessionsDirectory();
  const sessionDir = path.join(sessionsDir, sessionId);

  try {
    if (!fs.existsSync(sessionDir)) {
      return {
        success: true,
        message: `Diretório da sessão ${sessionId} não existe`,
        details: { sessionDir },
      };
    }

    const files = fs.readdirSync(sessionDir);

    if (files.length === 0) {
      return {
        success: true,
        message: `Diretório da sessão ${sessionId} já está vazio`,
        details: { sessionDir },
      };
    }

    logger.log(`Limpando ${files.length} arquivos da sessão ${sessionId}...`);

    let removedCount = 0;
    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      fs.unlinkSync(filePath);
      removedCount++;
    }

    return {
      success: true,
      message: `${removedCount} arquivos limpos para sessão ${sessionId}`,
      details: { sessionDir, filesRemoved: removedCount },
    };
  } catch (error) {
    logger.error(
      `Erro ao limpar arquivos da sessão ${sessionId}: ${error.message}`,
    );
    return {
      success: false,
      message: `Erro ao limpar arquivos da sessão: ${error.message}`,
      error,
    };
  }
}

export async function cleanAllSessionFiles(): Promise<FileCleanupResult> {
  const sessionsDir = ensureSessionsDirectory();

  try {
    const sessionDirs = fs.readdirSync(sessionsDir);

    if (sessionDirs.length === 0) {
      return {
        success: true,
        message: 'Não há sessões para limpar',
        details: { sessionsDir },
      };
    }

    logger.log(`Limpando ${sessionDirs.length} pastas de sessão...`);

    const results = {
      total: sessionDirs.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const sessionDir of sessionDirs) {
      const fullSessionDir = path.join(sessionsDir, sessionDir);

      if (fs.statSync(fullSessionDir).isDirectory()) {
        try {
          const files = fs.readdirSync(fullSessionDir);

          for (const file of files) {
            fs.unlinkSync(path.join(fullSessionDir, file));
          }

          results.successful++;
        } catch (error) {
          logger.warn(`Erro ao limpar sessão ${sessionDir}: ${error.message}`);
          results.failed++;
          results.errors.push(`${sessionDir}: ${error.message}`);
        }
      }
    }

    const resultMessage = `Limpeza concluída: ${results.successful} sessões limpas, ${results.failed} falhas`;
    logger.log(resultMessage);

    return {
      success: results.failed === 0,
      message: resultMessage,
      details: results,
    };
  } catch (error) {
    logger.error(`Erro ao limpar todas as sessões: ${error.message}`);

    return {
      success: false,
      message: `Erro ao limpar todas as sessões: ${error.message}`,
      error,
    };
  }
}
