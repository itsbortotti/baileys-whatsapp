import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description:
      'Número de telefone do destinatário no formato: códigopaís+número',
    example: '5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, {
    message: 'O número de telefone deve conter apenas dígitos',
  })
  to: string;

  @ApiProperty({
    description: 'Texto da mensagem a ser enviada',
    example: 'Olá, esta é uma mensagem de teste',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
