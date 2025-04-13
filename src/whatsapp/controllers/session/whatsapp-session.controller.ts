import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsappSessionService } from '../../services/session/whatsapp-session.service';
import { CreateSessionDto } from '../../dto/requests/create-session.dto';
import {
  SessionStatusResponseDto,
  SessionsListResponseDto,
  QrCodeResponseDto,
  DisconnectSessionResponseDto,
} from '../../dto/responses/session-response.dto';
import { ApiResponse as CustomApiResponse } from '../../interfaces/api-response.interface';
import { SessionError } from '../../errors/whatsapp.error';

@ApiTags('Sessões WhatsApp')
@Controller('sessions')
export class WhatsappSessionController {
  constructor(private readonly sessionService: WhatsappSessionService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova sessão WhatsApp' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SessionStatusResponseDto })
  async createSession(
    @Body() data: CreateSessionDto,
  ): Promise<CustomApiResponse<SessionStatusResponseDto>> {
    const result = await this.sessionService.createSession(data);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':sessionId/status')
  @ApiOperation({ summary: 'Obtém o status de uma sessão' })
  @ApiResponse({ status: HttpStatus.OK, type: SessionStatusResponseDto })
  async getSessionStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<CustomApiResponse<SessionStatusResponseDto>> {
    const result = await this.sessionService.getSessionStatus(sessionId);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':sessionId/qr')
  @ApiOperation({ summary: 'Obtém o QR code para autenticação' })
  @ApiResponse({ status: HttpStatus.OK, type: QrCodeResponseDto })
  async getQRCode(
    @Param('sessionId') sessionId: string,
  ): Promise<CustomApiResponse<QrCodeResponseDto>> {
    const result = await this.sessionService.getQRCode(sessionId);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as sessões' })
  @ApiResponse({ status: HttpStatus.OK, type: SessionsListResponseDto })
  async listSessions(): Promise<CustomApiResponse<SessionsListResponseDto>> {
    const result = await this.sessionService.listSessions();

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':sessionId')
  @ApiOperation({ summary: 'Remove uma sessão' })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteSession(
    @Param('sessionId') sessionId: string,
  ): Promise<CustomApiResponse<DisconnectSessionResponseDto>> {
    await this.sessionService.deleteSession(sessionId);

    return {
      success: true,
      data: { success: true },
      message: 'Sessão removida com sucesso',
      timestamp: new Date().toISOString(),
    };
  }
}
