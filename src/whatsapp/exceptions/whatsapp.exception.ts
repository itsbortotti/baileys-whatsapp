import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exceção personalizada para erros relacionados às sessões do WhatsApp
 */
export class WhatsAppException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({
      success: false,
      message,
      timestamp: new Date().toISOString(),
    }, status);
  }
}

/**
 * Exceção lançada quando uma sessão já existe
 */
export class SessionAlreadyExistsException extends WhatsAppException {
  constructor(sessionId: string) {
    super(`Sessão '${sessionId}' já existe`, HttpStatus.CONFLICT);
  }
}

/**
 * Exceção lançada quando uma sessão não é encontrada
 */
export class SessionNotFoundException extends WhatsAppException {
  constructor(sessionId: string) {
    super(`Sessão '${sessionId}' não encontrada`, HttpStatus.NOT_FOUND);
  }
}