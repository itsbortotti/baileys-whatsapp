import { ERROR_CONSTANTS } from '../constants/error';

export interface ErrorDetails {
  sessionId?: string;
  to?: string;
  originalError?: string;
  [key: string]: any;
}

export class WhatsappError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = 'WhatsappError';
  }
}

export class SessionError extends WhatsappError {
  constructor(message: string, details?: ErrorDetails) {
    super(
      message,
      ERROR_CONSTANTS.ERROR_CODES.SESSION_CONNECTION_FAILED,
      details,
    );
    this.name = 'SessionError';
  }
}

export class MessageError extends WhatsappError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, ERROR_CONSTANTS.ERROR_CODES.MESSAGE_SENDING_FAILED, details);
    this.name = 'MessageError';
  }
}

export class ConnectionError extends WhatsappError {
  constructor(message: string, details?: ErrorDetails) {
    super(
      message,
      ERROR_CONSTANTS.ERROR_CODES.SESSION_CONNECTION_FAILED,
      details,
    );
    this.name = 'ConnectionError';
  }
}

export class AuthError extends WhatsappError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, ERROR_CONSTANTS.ERROR_CODES.AUTH_FAILED, details);
    this.name = 'AuthError';
  }
}

export class ValidationError extends WhatsappError {
  constructor(message: string, details?: ErrorDetails) {
    super(
      message,
      ERROR_CONSTANTS.ERROR_CODES.MESSAGE_VALIDATION_FAILED,
      details,
    );
    this.name = 'ValidationError';
  }
}
