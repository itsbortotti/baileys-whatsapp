import { ApiProperty } from '@nestjs/swagger';

export class WhatsappSession {
  @ApiProperty({ description: 'ID único da sessão do WhatsApp' })
  sessionId: string;

  @ApiProperty({ description: 'Status de conexão da sessão' })
  connected: boolean;

  @ApiProperty({ description: 'QR Code para autenticação do WhatsApp Web', required: false })
  qrCode?: string;
}

export class SessionsList {
  @ApiProperty({ description: 'Número total de sessões' })
  count: number;

  @ApiProperty({ description: 'Lista de sessões ativas', type: [WhatsappSession] })
  sessions: WhatsappSession[];
}

export class ApiResponse<T> {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Dados retornados pela API' })
  data: T;

  @ApiProperty({ description: 'Mensagem descritiva da operação', required: false })
  message?: string;

  @ApiProperty({ description: 'Data e hora da resposta' })
  timestamp: string;
}