import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { ensureSessionsDirectory } from './file-cleaner.util';

const logger = new Logger('IntegrityChecker');

/**
 * Resultado de uma verificação de integridade
 */
export interface IntegrityCheckResult {
  /** Se a sessão possui arquivos válidos */
  isValid: boolean;
  /** Lista de arquivos corrompidos */
  corruptedFiles: string[];
}

/**
 * Verifica se existem arquivos corrompidos em uma sessão
 * @param sessionId ID da sessão a verificar
 * @returns Resultado da verificação
 */
export function checkSessionFilesIntegrity(
  sessionId: string,
): IntegrityCheckResult {
  const sessionsDir = ensureSessionsDirectory();
  const sessionDir = path.join(sessionsDir, sessionId);

  const result: IntegrityCheckResult = {
    isValid: true,
    corruptedFiles: [],
  };

  try {
    if (!fs.existsSync(sessionDir)) {
      return result; // Sem diretório, sem arquivos corrompidos
    }

    const files = fs.readdirSync(sessionDir);

    for (const file of files) {
      const filePath = path.join(sessionDir, file);

      try {
        // Verificar tamanho do arquivo
        const stats = fs.statSync(filePath);

        // Arquivos vazios são considerados corrompidos
        if (stats.size === 0) {
          result.isValid = false;
          result.corruptedFiles.push(file);
          continue;
        }

        // Para arquivos JSON, verificar se são válidos
        if (file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            JSON.parse(content);
          } catch (jsonError) {
            result.isValid = false;
            result.corruptedFiles.push(file);
          }
        }
      } catch (fileError) {
        result.isValid = false;
        result.corruptedFiles.push(file);
      }
    }

    return result;
  } catch (error) {
    logger.error(
      `Erro ao verificar integridade da sessão ${sessionId}: ${error.message}`,
    );
    result.isValid = false;
    return result;
  }
}
