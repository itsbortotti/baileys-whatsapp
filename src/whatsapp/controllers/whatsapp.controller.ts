import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsappService } from '../services/whatsapp.service';
import { WhatsappSession, SessionsList, ApiResponse as IApiResponse } from '../interfaces/session.interface';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('session/:sessionId')
  @ApiOperation({ summary: 'Criar nova sessão' })
  @ApiResponse({ status: 201, description: 'Sessão criada com sucesso' })
  async createSession(@Param('sessionId') sessionId: string): Promise<IApiResponse<WhatsappSession>> {
    const session = await this.whatsappService.createSession(sessionId);
    return {
      success: true,
      data: session,
      message: 'Sessão criada com sucesso',
      timestamp: new Date().toISOString()
    };
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Obter status da sessão' })
  @ApiResponse({ status: 200, description: 'Status da sessão obtido com sucesso' })
  async getSessionStatus(@Param('sessionId') sessionId: string): Promise<IApiResponse<WhatsappSession>> {
    const status = await this.whatsappService.getSessionStatus(sessionId);
    return {
      success: true,
      data: status,
      message: 'Status obtido com sucesso',
      timestamp: new Date().toISOString()
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Listar todas as sessões' })
  @ApiResponse({ status: 200, description: 'Lista de sessões obtida com sucesso' })
  async listSessions(): Promise<IApiResponse<SessionsList>> {
    const sessions = await this.whatsappService.listSessions();
    return {
      success: true,
      data: sessions,
      message: 'Lista de sessões obtida com sucesso',
      timestamp: new Date().toISOString()
    };
  }

  @Delete('session/:sessionId')
  @ApiOperation({ summary: 'Remover sessão' })
  @ApiResponse({ status: 200, description: 'Sessão removida com sucesso' })
  async deleteSession(@Param('sessionId') sessionId: string): Promise<IApiResponse<{ success: boolean }>> {
    await this.whatsappService.deleteSession(sessionId);
    return {
      success: true,
      data: { success: true },
      message: 'Sessão removida com sucesso',
      timestamp: new Date().toISOString()
    };
  }
}