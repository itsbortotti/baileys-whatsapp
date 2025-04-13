import { ConnectionInfo, ConnectionState } from '../../types';
import { Injectable, Logger } from '@nestjs/common';

import { ConnectionState as BaileysConnectionState } from '@whiskeysockets/baileys';
import { Connection } from './connection.model';
import { fromBaileysConnectionState } from '../../types/connection.types';

@Injectable()
export class ConnectionStateService {
  private readonly logger = new Logger(ConnectionStateService.name);
  private readonly connections = new Map<string, Connection>();

  async createConnection(sessionId: string): Promise<Connection> {
    this.logger.log(`Criando conexão para sessão: ${sessionId}`);
    try {
      const connection = new Connection();
      this.connections.set(sessionId, connection);
      return connection;
    } catch (error) {
      this.logger.error(
        `Erro ao criar conexão para sessão ${sessionId}: ${error.message}`,
      );
      throw new Error(`Falha ao criar conexão: ${error.message}`);
    }
  }
  async getConnection(sessionId: string): Promise<Connection> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new Error(`Connection not found for session: ${sessionId}`);
    }
    return connection;
  }

  async getConnectionInfo(sessionId: string): Promise<ConnectionInfo> {
    const connection = await this.getConnection(sessionId);
    return {
      sessionId,
      status: connection.state,
      createdAt: new Date(),
    };
  }

  async closeConnection(sessionId: string): Promise<void> {
    const connection = this.connections.get(sessionId);
    if (connection) {
      this.logger.log(`Fechando conexão para sessão: ${sessionId}`);
      try {
        await connection.close();
        this.connections.delete(sessionId);
      } catch (error) {
        this.logger.error(
          `Erro ao fechar conexão para sessão ${sessionId}: ${error.message}`,
        );
        throw new Error(`Falha ao fechar conexão: ${error.message}`);
      }
    } else {
      this.logger.warn(
        `Tentativa de fechar conexão inexistente para sessão: ${sessionId}`,
      );
    }
  }
  async getState(sessionId: string): Promise<ConnectionState> {
    const connection = await this.getConnection(sessionId);
    return connection.state;
  }

  async updateState(
    sessionId: string,
    state: BaileysConnectionState,
  ): Promise<void> {
    const connection = await this.getConnection(sessionId);
    connection.state = fromBaileysConnectionState(state);
  }

  async clearState(sessionId: string): Promise<void> {
    this.logger.log(`Clearing connection state for session: ${sessionId}`);
    this.connections.delete(sessionId);
  }
}
