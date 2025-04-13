import { Injectable, Logger } from '@nestjs/common';
import { MessageError } from '../../errors/whatsapp.error';

/**
 * Serviço responsável pelo gerenciamento da fila de mensagens
 * para evitar flood e garantir entrega ordenada
 */
@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);
  private readonly messageQueue = new Map<string, any[]>();

  /**
   * Adiciona uma mensagem à fila para processamento posterior
   */
  async queueMessage(sessionId: string, message: any): Promise<void> {
    this.logger.log(`Adicionando mensagem à fila para sessão ${sessionId}`);

    try {
      const sessionQueue = this.messageQueue.get(sessionId) || [];
      sessionQueue.push(message);
      this.messageQueue.set(sessionId, sessionQueue);
    } catch (error) {
      this.logger.error(`Erro ao adicionar mensagem à fila: ${error.message}`);
      throw new MessageError('Falha ao adicionar mensagem à fila', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Processa a fila de mensagens de uma sessão
   */
  async processQueue(sessionId: string): Promise<void> {
    this.logger.log(`Processando fila de mensagens da sessão ${sessionId}`);

    try {
      const sessionQueue = this.messageQueue.get(sessionId) || [];
      // Implementar lógica de processamento
    } catch (error) {
      this.logger.error(
        `Erro ao processar fila de mensagens: ${error.message}`,
      );
      throw new MessageError('Falha ao processar fila de mensagens', {
        sessionId,
        originalError: error.message,
      });
    }
  }

  /**
   * Enfileira uma tarefa para execução
   * @param sessionId ID da sessão
   * @param task Função a ser executada
   * @returns Resultado da execução da tarefa
   */
  async enqueue<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
    this.logger.debug(`Executando tarefa para a sessão ${sessionId}`);

    try {
      // Por enquanto, só executa a tarefa diretamente
      // No futuro, implementar enfileiramento real
      return await task();
    } catch (error) {
      this.logger.error(`Erro ao executar tarefa na fila: ${error.message}`);
      throw new MessageError('Falha ao executar tarefa na fila', {
        sessionId,
        originalError: error.message,
      });
    }
  }
}
