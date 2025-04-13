import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto, SendImageDto } from '../../dto';
import { ValidationError } from '../../errors/whatsapp.error';
import { MESSAGE_CONSTANTS, MESSAGE_ERRORS } from '../../constants/message';

@Injectable()
export class MessageValidatorService {
  private readonly logger = new Logger(MessageValidatorService.name);
  private readonly VALID_IMAGE_FORMATS =
    MESSAGE_CONSTANTS.VALID_MEDIA_TYPES.IMAGE;

  validateTextMessage(dto: SendMessageDto): void {
    try {
      if (!dto.to || dto.to.trim() === '') {
        throw new ValidationError(MESSAGE_ERRORS.VALIDATION.INVALID_NUMBER);
      }

      if (!dto.message || dto.message.trim() === '') {
        throw new ValidationError(MESSAGE_ERRORS.VALIDATION.EMPTY_MESSAGE);
      }

      if (
        dto.message.length > MESSAGE_CONSTANTS.MESSAGE_LIMITS.MAX_TEXT_LENGTH
      ) {
        throw new ValidationError(
          `Mensagem excede o limite de ${MESSAGE_CONSTANTS.MESSAGE_LIMITS.MAX_TEXT_LENGTH} caracteres`,
        );
      }

      if (!/^\+?[0-9]+$/.test(dto.to.replace(/\D/g, ''))) {
        throw new ValidationError(MESSAGE_ERRORS.VALIDATION.INVALID_NUMBER);
      }
    } catch (error) {
      this.logger.error(`Erro na validação de mensagem: ${error.message}`);
      throw error;
    }
  }

  validateImageMessage(dto: SendImageDto): void {
    try {
      if (!dto.to || dto.to.trim() === '') {
        throw new ValidationError(MESSAGE_ERRORS.VALIDATION.INVALID_NUMBER);
      }

      if (!dto.image || dto.image.trim() === '') {
        throw new ValidationError(MESSAGE_ERRORS.VALIDATION.INVALID_MEDIA);
      }

      if (
        dto.caption &&
        dto.caption.length > MESSAGE_CONSTANTS.MESSAGE_LIMITS.MAX_CAPTION_LENGTH
      ) {
        throw new ValidationError(
          `Legenda excede o limite de ${MESSAGE_CONSTANTS.MESSAGE_LIMITS.MAX_CAPTION_LENGTH} caracteres`,
        );
      }

      if (!/^\+?[0-9]+$/.test(dto.to.replace(/\D/g, ''))) {
        throw new ValidationError(MESSAGE_ERRORS.VALIDATION.INVALID_NUMBER);
      }

      if (!this.isValidImageFormat(dto.image)) {
        throw new ValidationError(
          'Formato de imagem inválido. Use JPEG, PNG ou WebP',
        );
      }
    } catch (error) {
      this.logger.error(`Erro na validação de imagem: ${error.message}`);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }

  private isValidImageFormat(imageUrl: string): boolean {
    try {
      const format = imageUrl.split(';')[0].split('/')[1].toLowerCase();
      return this.VALID_IMAGE_FORMATS.includes(`image/${format}`);
    } catch {
      return false;
    }
  }
}
