import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Validação para parâmetro sessionId de rotas
 */
export class SessionIdParam {
  @ApiProperty({
    description: 'Identificador único da sessão',
    example: 'user123',
  })
  @IsString({ message: 'ID da sessão deve ser uma string' })
  @IsNotEmpty({ message: 'ID da sessão não pode estar vazio' })
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message:
      'ID da sessão deve conter apenas letras, números, sublinhados, hifens e pontos',
  })
  sessionId: string;
}
