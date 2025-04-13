import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { WhatsappError } from '../errors/whatsapp.error';
import { ERROR_CONSTANTS } from '../constants/error';

interface ErrorResponse {
  code: string;
  message: string;
  details: Record<string, any> | undefined;
}

interface ApiErrorResponse {
  success: boolean;
  error: ErrorResponse;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: ERROR_CONSTANTS.ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_CONSTANTS.ERROR_MESSAGES.INTERNAL_ERROR,
        details: undefined,
      },
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse.error = {
        code: ERROR_CONSTANTS.ERROR_CODES.SYSTEM_ERROR,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : (exceptionResponse as any).message || exception.message,
        details: undefined,
      };
    } else if (exception instanceof WhatsappError) {
      status = this.getHttpStatus(exception.code);
      errorResponse.error = {
        code: exception.code,
        message: exception.message,
        details: exception.details || undefined,
      };
    }

    this.logger.error(
      `[${errorResponse.error.code}] ${errorResponse.error.message}`,
      exception instanceof WhatsappError ? exception.details : undefined,
    );

    response.status(status).json(errorResponse);
  }

  private getHttpStatus(errorCode: string): number {
    switch (errorCode) {
      case ERROR_CONSTANTS.ERROR_CODES.SESSION_NOT_FOUND:
        return ERROR_CONSTANTS.HTTP_STATUS.NOT_FOUND;
      case ERROR_CONSTANTS.ERROR_CODES.SESSION_ALREADY_EXISTS:
        return ERROR_CONSTANTS.HTTP_STATUS.CONFLICT;
      case ERROR_CONSTANTS.ERROR_CODES.AUTH_FAILED:
        return ERROR_CONSTANTS.HTTP_STATUS.UNAUTHORIZED;
      case ERROR_CONSTANTS.ERROR_CODES.MESSAGE_VALIDATION_FAILED:
      case ERROR_CONSTANTS.ERROR_CODES.MESSAGE_QUEUE_FULL:
        return ERROR_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
      default:
        return ERROR_CONSTANTS.HTTP_STATUS.INTERNAL_ERROR;
    }
  }
}
