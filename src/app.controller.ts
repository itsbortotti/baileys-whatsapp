import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthCheck } from './app.service';
import { Controller, Get } from '@nestjs/common';

@ApiTags('Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @ApiOperation({ summary: 'Rota raiz' })
  @ApiResponse({
    status: 200,
    description: 'Mensagem de boas-vindas',
    type: 'string',
  })
  getRoot(): string {
    return 'Bem-vindo ao Baileys WhatsApp API!';
  }

  @Get('health')
  @ApiOperation({ summary: 'Verifica o status da aplicação' })
  @ApiResponse({
    status: 200,
    description: 'Retorna o status dos serviços da aplicação',
    type: 'object',
  })
  async getHealth(): Promise<HealthCheck> {
    return this.appService.getHealth();
  }

  @Get('api')
  @ApiOperation({ summary: 'API endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API endpoint response',
    type: 'string',
  })
  getApi(): string {
    return 'API endpoint is working!';
  }
}
