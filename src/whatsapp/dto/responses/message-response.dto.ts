import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para resposta de envio de mensagem de texto
 */
export class SendMessageResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Identificador único da mensagem enviada',
    example: 'ABCDEF123456789012345',
    required: false,
  })
  messageId?: string;

  @ApiProperty({
    description: 'Número de telefone do destinatário',
    example: '5511999999999',
  })
  to: string;
}

/**
 * DTO para resposta de envio de imagem
 */
export class SendImageResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Identificador único da mensagem enviada',
    example: 'ABCDEF123456789012345',
    required: false,
  })
  messageId?: string;

  @ApiProperty({
    description: 'Número de telefone do destinatário',
    example: '5511999999999',
  })
  to: string;

  @ApiProperty({
    description: 'Tipo de imagem enviada (URL ou Base64)',
    example: 'URL',
    enum: ['URL', 'Base64'],
    required: false,
  })
  imageType?: string;
}

/**
 * DTO para resposta de erro no envio de mensagem
 */
export class MessageErrorResponseDto {
  @ApiProperty({
    description: 'Indica que a operação falhou',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Falha ao enviar mensagem: Sessão não está conectada',
  })
  error: string;

  @ApiProperty({
    description: 'Detalhes adicionais do erro',
    example: { code: 'SESSION_NOT_CONNECTED', sessionId: 'user123' },
    required: false,
  })
  details?: Record<string, any>;
}
