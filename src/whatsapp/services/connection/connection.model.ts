import { ConnectionState } from '../../types';

/**
 * Classe que implementa a interface Connection
 */
export class Connection {
  state: ConnectionState = ConnectionState.DISCONNECTED;
  qrCode?: string;

  /**
   * Fecha a conexão
   */
  async close(): Promise<void> {
    // Implementação do método close
    this.state = ConnectionState.DISCONNECTED;
  }
}
