import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  /**
   * Salva uma nova mensagem no banco de dados
   * @param messageData Dados da mensagem a ser salva
   * @returns Mensagem salva
   */
  async saveMessage(messageData: Partial<Message>): Promise<Message> {
    this.logger.debug(`Salvando mensagem para sessão: ${messageData.sessionId}`);
    const message = this.messageRepository.create(messageData);
    return await this.messageRepository.save(message);
  }
}