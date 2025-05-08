import { proto } from '@whiskeysockets/baileys';

export interface IWhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id?: string;
  };
  message: proto.IMessage;
  messageTimestamp?: number;
}