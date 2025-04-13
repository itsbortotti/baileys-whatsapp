import { Logger } from '@nestjs/common';

// Interface de logger compatível com Baileys
export interface ILogger {
  info(...args: any[]): void;
  debug(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  trace(...args: any[]): void;
  child(obj: Record<string, unknown>): ILogger;
  level: string;
}

// Implementação do logger para compatibilidade com Baileys
export class BaileysLogger implements ILogger {
  private nestLogger: Logger;
  private logContext: string;

  constructor(context: string) {
    this.nestLogger = new Logger(context);
    this.logContext = context;
  }

  info(...args: any[]): void {
    this.nestLogger.log(args.join(' '));
  }

  debug(...args: any[]): void {
    this.nestLogger.debug(args.join(' '));
  }

  warn(...args: any[]): void {
    this.nestLogger.warn(args.join(' '));
  }

  error(...args: any[]): void {
    this.nestLogger.error(args.join(' '));
  }

  trace(...args: any[]): void {
    this.nestLogger.verbose(args.join(' '));
  }

  child(obj: Record<string, unknown>): ILogger {
    const contextExt = Object.entries(obj)
      .map(([k, v]) => `${k}:${String(v)}`)
      .join(',');
    return new BaileysLogger(`${this.logContext}:${contextExt}`);
  }

  level: string = 'info';
}
