import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class SendImageDto {
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
    description: 'URL ou string Base64 da imagem',
    example: 'https://example.com/imagem.jpg',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Legenda para a imagem (opcional)',
    example: 'Veja esta foto!',
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;
}
