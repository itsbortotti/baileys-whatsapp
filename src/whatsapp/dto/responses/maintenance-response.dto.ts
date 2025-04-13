import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para resposta de status do serviço
 */
export class ServiceStatusResponseDto {
  @ApiProperty({
    description: 'Status atual do serviço WhatsApp',
    example: 'disponível',
    enum: ['disponível', 'parcial', 'indisponível', 'manutenção'],
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp da verificação em formato ISO',
    example: '2025-04-12T22:15:30.123Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Detalhes adicionais sobre o status do serviço',
    example: {
      uptime: '3d 5h 12m',
      activeSessions: 5,
      memoryUsage: '412MB',
    },
    required: false,
  })
  details?: Record<string, any>;
}

/**
 * DTO para resposta de limpeza de arquivos
 */
export class CleanFilesResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem descritiva do resultado da operação',
    example: '5 arquivos removidos para sessão user123',
  })
  message: string;

  @ApiProperty({
    description: 'Quantidade de arquivos removidos',
    example: 5,
    required: false,
  })
  filesRemoved?: number;

  @ApiProperty({
    description: 'Detalhes adicionais sobre a operação',
    example: {
      sessionId: 'user123',
      sessionDir: '/app/sessions/user123',
      timestamp: '2025-04-12T22:15:30.123Z',
    },
    required: false,
  })
  details?: Record<string, any>;
}

/**
 * DTO para resposta de erro em operações de manutenção
 */
export class MaintenanceErrorResponseDto {
  @ApiProperty({
    description: 'Indica que a operação falhou',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Falha ao limpar arquivos: Diretório não encontrado',
  })
  error: string;

  @ApiProperty({
    description: 'Detalhes adicionais do erro',
    example: {
      code: 'DIRECTORY_NOT_FOUND',
      path: '/app/sessions/user123',
      sessionId: 'user123',
    },
    required: false,
  })
  details?: Record<string, any>;
}
