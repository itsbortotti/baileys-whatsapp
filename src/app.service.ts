import { Injectable, Logger } from '@nestjs/common';
import { redisClient } from './config/redis.config';

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  redis: {
    connected: boolean;
    message?: string;
  };
  uptime: number;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  async getHealth(): Promise<HealthCheck> {
    const redisStatus = await this.checkRedisConnection();

    return {
      status: redisStatus.connected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      uptime: process.uptime(),
    };
  }

  private async checkRedisConnection(): Promise<{
    connected: boolean;
    message?: string;
  }> {
    try {
      await redisClient.ping();
      return { connected: true };
    } catch (error) {
      this.logger.error('Erro ao verificar conexão com Redis:', error.message);
      return {
        connected: false,
        message: 'Redis não está respondendo',
      };
    }
  }
}
