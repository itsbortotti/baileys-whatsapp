import { Injectable, Logger } from '@nestjs/common';
import {
  QrCodeResponseDto,
  SessionStatusResponseDto,
  SessionsListResponseDto,
} from '../../dto/responses/session-response.dto';

import { CreateSessionDto } from '../../dto/requests/create-session.dto';
import { ServiceStatusResponseDto } from '../../dto/responses/maintenance-response.dto';
import { SessionError } from '../../errors/whatsapp.error';
import { SessionEventsService } from './session-events.service';
import { SessionManagerService } from './session-manager.service';
import { SessionStateService } from './session-state.service';
import { SessionStatus } from '../../constants/whatsapp.constants';
import { WhatsappConnectionService } from '../connection/whatsapp-connection.service';

@Injectable()
export class WhatsappSessionService {
  private readonly logger = new Logger(WhatsappSessionService.name);

  constructor(
    private readonly stateService: SessionStateService,
    private readonly eventsService: SessionEventsService,
    private readonly managerService: SessionManagerService,
    private readonly connectionService: WhatsappConnectionService,
  ) {}

  async createSession(
    data: CreateSessionDto,
  ): Promise<SessionStatusResponseDto> {
    this.logger.log(`Criando nova sessão ${data.sessionId}`);

    try {
      await this.managerService.createSession(data.sessionId);
      await this.eventsService.setupCallbacks(data.sessionId, data.callbacks);
      const status = await this.stateService.getSessionStatus(data.sessionId);

      return {
        success: true,
        sessionId: data.sessionId,
        status,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao criar sessão ${data.sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao criar sessão', {
        sessionId: data.sessionId,
        originalError: error.message,
      });
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.logger.log(`Removendo sessão ${sessionId}`);

    try {
      await this.connectionService.disconnect(sessionId);
      await this.eventsService.removeEventHandlers(sessionId);
      await this.managerService.deleteSession(sessionId);
      await this.stateService.clearSessionState(sessionId);
    } catch (error) {
      this.logger.error(
        `Erro ao remover sessão ${sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao remover sessão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatusResponseDto> {
    try {
      const status = await this.stateService.getSessionStatus(sessionId);
      const isConnected = await this.connectionService.isConnected(sessionId);

      return {
        success: true,
        sessionId,
        status: isConnected ? SessionStatus.CONNECTED : status,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter status da sessão ${sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao obter status da sessão', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  async listSessions(): Promise<SessionsListResponseDto> {
    try {
      const sessions = await this.managerService.listSessions();
      const sessionsData = await Promise.all(
        sessions.map(async (sessionId) => ({
          sessionId,
          status: await this.stateService.getSessionStatus(sessionId),
        })),
      );

      return {
        success: true,
        count: sessions.length,
        sessions: sessionsData,
      };
    } catch (error) {
      this.logger.error(`Erro ao listar sessões: ${error.message}`);
      throw new SessionError('Falha ao listar sessões', {
        originalError: error.message,
      });
    }
  }

  async getQRCode(sessionId: string): Promise<QrCodeResponseDto> {
    this.logger.log(`Obtendo QR code para sessão ${sessionId}`);

    try {
      const sessionStatus = await this.stateService.getSessionStatus(sessionId);

      if (sessionStatus !== SessionStatus.DISCONNECTED) {
        throw new SessionError(
          'QR code não disponível: sessão já está conectada ou em outro estado',
          { sessionId, status: sessionStatus },
        );
      }

      const qrCode = await this.managerService.getQrCode(sessionId);

      if (!qrCode) {
        throw new SessionError('QR code não disponível no momento', {
          sessionId,
        });
      }

      return {
        qrCode,
        sessionId,
        success: true,
      };
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }

      this.logger.error(
        `Erro ao obter QR code da sessão ${sessionId}: ${error.message}`,
      );
      throw new SessionError('Falha ao obter QR code', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Obtém o status geral do serviço WhatsApp
   * Inclui informações como uptime, sessões ativas e uso de memória
   */
  async getServiceStatus(): Promise<ServiceStatusResponseDto> {
    this.logger.log('Verificando status do serviço WhatsApp');

    try {
      // Obtém a lista de sessões
      const sessions = await this.managerService.listSessions();

      // Calcula o número de sessões ativas
      let activeSessions = 0;
      await Promise.all(
        sessions.map(async (sessionId) => {
          const isConnected =
            await this.connectionService.isConnected(sessionId);
          if (isConnected) {
            activeSessions++;
          }
        }),
      );

      // Calcula o uptime do processo
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const uptimeString = `${days}d ${hours}h ${minutes}m`;

      // Obtém o uso de memória
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024);

      // Determina o status do serviço
      let status = 'disponível';

      // Verificações para determinar o status
      if (memoryUsageMB > 1024) {
        // Se o uso de memória for muito alto, o serviço pode estar em estado parcial
        status = 'parcial';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        details: {
          uptime: uptimeString,
          activeSessions,
          totalSessions: sessions.length,
          memoryUsage: `${memoryUsageMB}MB`,
          nodeVersion: process.version,
          platform: process.platform,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao verificar status do serviço: ${error.message}`,
      );
      throw new SessionError('Falha ao verificar status do serviço', {
        originalError: error.message,
      });
    }
  }
}
