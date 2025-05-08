import { IsNotEmpty, IsString, Matches } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class IMessageRequest {
  @ApiProperty({ 
    description: 'Número do destinatário no formato: 5511999999999@s.whatsapp.net',
    example: '5511999999999@s.whatsapp.net'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{12,13}@s\.whatsapp\.net$/, {
    message: 'O número deve estar no formato: 5511999999999@s.whatsapp.net'
  })
  to: string;

  @ApiProperty({ 
    description: 'Conteúdo da mensagem',
    example: 'Olá, como vai?' 
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}