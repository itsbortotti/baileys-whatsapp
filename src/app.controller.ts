import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService, HealthCheck } from './app.service';

@ApiTags('Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
