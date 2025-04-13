import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Opções de configuração para criação de sessão
 */
export class SessionOptions {
  @ApiProperty({
    description: 'Se deve exibir QR code no terminal',
    example: false,
    required: false,
  })
  @IsOptional()
  printQRInTerminal?: boolean;

  @ApiProperty({
    description: 'Timeout para conexão em milissegundos',
    example: 60000,
    required: false,
  })
  @IsOptional()
  timeout?: number;

  @ApiProperty({
    description: 'Versão específica do WhatsApp Web a ser usada',
    example: '2.2424.11',
    required: false,
  })
  @IsOptional()
  @IsString()
  waVersion?: string;
}

/**
 * Callbacks para eventos durante a sessão.
 * Todas as funções são assíncronas e recebem o sessionId como primeiro parâmetro.
 */
export class SessionCallbacks {
  /**
   * Callback chamado quando um novo QR code é gerado.
   * @param sessionId - ID da sessão que gerou o QR code
   * @param qr - String contendo o QR code em formato base64
   */
  @ApiProperty({
    description: 'Função a ser chamada quando QR code for gerado',
    required: false,
  })
  @IsOptional()
  onQRCode?: (sessionId: string, qr: string) => Promise<void>;

  /**
   * Callback chamado quando a sessão é conectada com sucesso.
   * @param sessionId - ID da sessão que foi conectada
   */
  @ApiProperty({
    description: 'Função a ser chamada quando a sessão for conectada',
    required: false,
  })
  @IsOptional()
  onConnected?: (sessionId: string) => Promise<void>;

  /**
   * Callback chamado quando a sessão é desconectada.
   * @param sessionId - ID da sessão que foi desconectada
   */
  @ApiProperty({
    description: 'Função a ser chamada quando a sessão for desconectada',
    required: false,
  })
  @IsOptional()
  onDisconnected?: (sessionId: string) => Promise<void>;
}

/**
 * DTO para criação de sessão do WhatsApp
 */
export class CreateSessionDto {
  @ApiProperty({
    description: 'ID da sessão a ser criada',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Nome amigável para a sessão',
    example: 'Atendimento Cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionName?: string;

  @ApiProperty({
    description: 'Opções de configuração para a sessão',
    type: SessionOptions,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SessionOptions)
  options?: SessionOptions;

  @ApiProperty({
    description: 'Callbacks para eventos durante a sessão',
    type: SessionCallbacks,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SessionCallbacks)
  callbacks?: SessionCallbacks;
}
