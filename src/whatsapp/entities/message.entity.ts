import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: string;

  @Column()
  remoteJid: string;

  @Column()
  fromMe: boolean;

  @Column()
  messageType: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  quotedMessageId: string;

  @CreateDateColumn()
  timestamp: Date;
}