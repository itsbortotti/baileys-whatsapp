import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para resposta de status de sessão
 */
export class SessionStatusResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID da sessão',
    example: 'session123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Status atual da sessão (connected ou disconnected)',
    example: 'connected',
    enum: ['connected', 'disconnected', 'connecting', 'failed'],
  })
  status: string;
}

/**
 * DTO para resposta de criação de sessão
 */
export class CreateSessionResponseDto extends SessionStatusResponseDto {
  @ApiProperty({
    description: 'Mensagem descritiva do resultado da operação',
    example: 'Sessão criada com sucesso',
  })
  message?: string;
}

/**
 * DTO para resposta de QR code
 */
export class QrCodeResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'ID da sessão',
    example: 'session123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'String do QR code para autenticação',
    example: '1@a2WdC3vFgHiJkLmNoPqRsTuV5wXyZ6789ABCDEFG0123456789...',
  })
  qrCode: string;
}
/**
 * DTO para informações básicas de uma sessão
 */
export class SessionInfoDto {
  @ApiProperty({
    description: 'Identificador único da sessão',
    example: 'user123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Status atual da sessão',
    example: 'connected',
    enum: ['connected', 'disconnected', 'connecting', 'failed'],
  })
  status: string;
}

export class SessionsListResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
  })
  success: boolean;

  @ApiProperty({
    description: 'Quantidade de sessões encontradas',
    example: 2,
  })
  count: number;

  @ApiProperty({
    description: 'Lista de sessões',
    type: [SessionInfoDto],
  })
  sessions: SessionInfoDto[];
}

/**
 * DTO para resposta de desconexão de sessão
 */
export class DisconnectSessionResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;
}
