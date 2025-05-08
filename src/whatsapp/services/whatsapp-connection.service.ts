import * as qrcode from 'qrcode-terminal';

import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, { 
  DisconnectReason, 
  WASocket, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  ConnectionState,
  BaileysEventMap,
  WAMessageKey,
  makeCacheableSignalKeyStore,
  delay,
  proto,
  CacheStore,
  WAMessage,
  AnyMessageContent,
} from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import { IWhatsAppSessionData } from '../interfaces/whatsapp-session.interface';
import { MessageService } from './message.service';
import { WhatsAppEventService } from './whatsapp-event.service';
import { join } from 'path';

/**
 * Interface para o Logger usado pelo Baileys
 */
interface BaileysLogger {
  info(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  debug(...args: any[]): void;
  trace(...args: any[]): void;
  child(options: any): BaileysLogger;
  level: string;
}

/**
 * Interface para armazenar informações de reconexão
 */
interface ReconnectionInfo {
  attempts: number;
  lastAttempt: Date;
  intervalId?: NodeJS.Timeout;
}

/**
 * Interface para armazenar informações do estado da conexão
 */
interface ConnectionInfo {
  isConnected: boolean;
  connectionState: string;
  lastStateUpdate: Date;
  connectionTries: number;
  isReady: boolean; // Indica se a conexão está pronta para enviar mensagens
  lastActivity: Date; // Última atividade na conexão
  appStateSyncError: boolean; // Indica se houve erro na sincronização do appState
  lastAppStateSyncAttempt: Date; // Última tentativa de sincronização do appState
}
/**
 * Adaptador para o Logger do NestJS para compatibilidade com BaileysLogger
 */
class BaileysLoggerAdapter implements BaileysLogger {
  constructor(private readonly nestLogger: Logger) {}

  info(...args: any[]): void {
    this.nestLogger.log(args.join(' '));
  }

  error(...args: any[]): void {
    this.nestLogger.error(args.join(' '));
  }

  warn(...args: any[]): void {
    this.nestLogger.warn(args.join(' '));
  }

  debug(...args: any[]): void {
    this.nestLogger.debug(args.join(' '));
  }

  trace(...args: any[]): void {
    this.nestLogger.verbose(args.join(' '));
  }

  // Método obrigatório para BaileysLogger, mas não usado
  child(options: any): BaileysLogger {
    return this;
  }

  // Propriedade obrigatória para BaileysLogger
  level: string = 'info';
}

/**
 * Implementação de CacheStore para armazenar contadores de tentativas de mensagens
 */
class MessageRetryCache implements CacheStore {
  private cache: Map<string, any> = new Map();

  constructor() {}

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): any {
    this.cache.set(key, value);
    return value;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  flushAll(): void {
    this.cache.clear();
  }
}

@Injectable()
export class WhatsAppConnectionService {
  private readonly logger = new Logger(WhatsAppConnectionService.name);
  
  // Mapa para armazenar informações de reconexão por sessão
  private reconnectionInfo: Map<string, ReconnectionInfo> = new Map();
  
  // Mapa para armazenar informações de estado de conexão por sessão
  private connectionState: Map<string, ConnectionInfo> = new Map();

  // Cache para contadores de tentativas de mensagens
  private msgRetryCache = new MessageRetryCache();

  // Adaptador de logger para compatibilidade com Baileys
  private baileysLogger: BaileysLoggerAdapter;
  
  // Constantes de configuração
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_RECONNECT_DELAY_MS = 5000;
  private readonly MAX_RECONNECT_DELAY_MS = 300000; // 5 minutos
  private readonly CONNECTION_MONITOR_INTERVAL_MS = 30000; // 30 segundos (reduzido para monitoramento mais frequente)
  private readonly CONNECTION_TIMEOUT = 40000; // 40 segundos de timeout para operações de conexão
  private readonly CONNECTION_READY_TIMEOUT = 10000; // 10 segundos para considerar a conexão pronta após estar aberta
  private readonly CONNECTION_ACTIVITY_TIMEOUT = 60000; // 60 segundos sem atividade para verificar a conexão
  private readonly MAX_APPSTATE_SYNC_ATTEMPTS = 3; // Número máximo de tentativas de sincronização do appState
  
  constructor(
    private readonly messageService: MessageService,
    private readonly eventService: WhatsAppEventService
  ) {
    // Inicializar o adaptador de logger
    this.baileysLogger = new BaileysLoggerAdapter(this.logger);
  }

  /**
   * Cria uma nova conexão do WhatsApp com tratamento de erros aprimorado
   * @param sessionId ID da sessão
   * @param onUpdate Callback para atualizar o estado da sessão
   * @param isReconnect Flag indicando se é uma tentativa de reconexão
   * @returns Dados da sessão do WhatsApp
   */
  async createConnection(
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void,
    isReconnect: boolean = false
  ): Promise<IWhatsAppSessionData> {
    this.logger.log(`Iniciando criação de conexão para sessão: ${sessionId}`);
    
    // Inicializar ou atualizar informações de reconexão e estado
    if (!isReconnect) {
      this.resetReconnectionInfo(sessionId);
      this.initializeConnectionState(sessionId);
    }

    try {
      // Obter a versão mais recente do Baileys
      const { version } = await fetchLatestBaileysVersion();
      this.logger.debug(`Usando versão do Baileys: ${version.join('.')}`);

      // Carregar estado de autenticação
      const sessionDir = join(process.cwd(), 'sessions', sessionId);
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      // Criar armazenamento de chaves com cache para melhor desempenho
      const signalStore = makeCacheableSignalKeyStore(state.keys, this.baileysLogger);
      this.logger.debug(`Estado de autenticação carregado para sessão: ${sessionId}`);

      // Criar socket com configurações otimizadas para estabilidade
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          // Usar o armazenamento em cache para as chaves
          keys: signalStore
        },
        printQRInTerminal: false,
        version,
        connectTimeoutMs: this.CONNECTION_TIMEOUT,
        keepAliveIntervalMs: 30000, // 30 segundos
        retryRequestDelayMs: 3000,
        markOnlineOnConnect: true,
        browser: ['Chrome', 'Desktop', '105.0.0.0'],
        transactionOpts: {
          maxCommitRetries: 10,
          delayBetweenTriesMs: 3000
        },
        getMessage: async () => {
          return { conversation: 'hello' };
        },
        emitOwnEvents: true,
        fireInitQueries: true,
        // Opções adicionais para melhorar a estabilidade
        defaultQueryTimeoutMs: 60000, // 60 segundos para timeout de consultas
        syncFullHistory: true, // Sincronizar histórico completo
        shouldIgnoreJid: jid => false, // Não ignorar JIDs
        // Recuperação de histórico de mensagens
        msgRetryCounterCache: this.msgRetryCache,
        // Patchear mensagens para garantir IDs únicos
        patchMessageBeforeSending: (msg: any, recipientJids: string[]): proto.IMessage => {
          // Cast para tipo correto que possui propriedade key
          const webMsg = msg as proto.IWebMessageInfo;
          
          // Verifica se a mensagem tem uma key e id
          if (webMsg.key && !webMsg.key.id) {
            // Atualiza o ID da key existente
            webMsg.key.id = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          } else if (!webMsg.key) {
            // Cria uma key nova se não existir
            webMsg.key = {
              id: `${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              remoteJid: recipientJids[0], // Usa o primeiro destinatário como remoteJid
              fromMe: true // Marca como enviado por nós
            };
          }
          
          // Retorna a mensagem modificada
          return msg as proto.IMessage;
        }
      });

      this.logger.debug(`Socket criado para sessão: ${sessionId}`);
      
      // Configurar todos os listeners para o socket
      this.setupListeners(sock, sessionId, onUpdate, saveCreds);
      
      return { sock, connected: false };
    } catch (error) {
      this.logger.error(
        `Erro ao criar conexão para sessão ${sessionId}: ${error.message}`, 
        error.stack
      );
      
      // Se não for uma reconexão, tenta uma vez imediatamente
      if (!isReconnect) {
        this.logger.warn(`Tentando reconectar imediatamente para sessão ${sessionId} após falha na criação...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.createConnection(sessionId, onUpdate, true);
      }
      
      // Se a reconexão falhou e excedeu o número máximo de tentativas
      const reconnectionInfo = this.reconnectionInfo.get(sessionId);
      if (reconnectionInfo && reconnectionInfo.attempts >= this.MAX_RECONNECT_ATTEMPTS) {
        this.logger.error(`Número máximo de tentativas de reconexão (${this.MAX_RECONNECT_ATTEMPTS}) excedido para sessão ${sessionId}`);
        throw new Error(`Não foi possível estabelecer conexão após ${this.MAX_RECONNECT_ATTEMPTS} tentativas.`);
      }
      
      // Agendar próxima tentativa de reconexão com backoff exponencial
      const reconnectDelay = this.calculateReconnectionDelay(sessionId);
      this.logger.warn(`Agendando próxima tentativa de reconexão para sessão ${sessionId} em ${reconnectDelay/1000} segundos`);
      
      // Lançar erro para que o chamador saiba que a conexão falhou
      throw error;
    }
  }
  
  private updateConnectionState(
    sessionId: string, 
    isConnected: boolean, 
    state: string,
    isReady: boolean = false
  ): void {
    const current = this.connectionState.get(sessionId) || {
      isConnected: false,
      connectionState: 'unknown',
      lastStateUpdate: new Date(),
      connectionTries: 0,
      isReady: false,
      lastActivity: new Date(),
      appStateSyncError: false,
      lastAppStateSyncAttempt: new Date()
    };
    
    const now = new Date();
    
    this.connectionState.set(sessionId, {
      ...current,
      isConnected,
      connectionState: state,
      lastStateUpdate: now,
      isReady: isReady || current.isReady,
      lastActivity: now
    });
    
    this.logger.debug(
      `Estado da conexão atualizado para sessão ${sessionId}: ${state} (conectado: ${isConnected}, pronto: ${isReady || current.isReady})`
    );
  }
  
  /**
   * Marca uma conexão como pronta para enviar mensagens
   * @param sessionId ID da sessão
   */
  private markConnectionReady(sessionId: string): void {
    const current = this.connectionState.get(sessionId);
    if (!current) return;
    
    current.isReady = true;
    current.lastActivity = new Date();
    this.connectionState.set(sessionId, current);
    
    this.logger.log(`Conexão para sessão ${sessionId} está pronta para enviar mensagens`);
  }
  
  /**
   * Registra um erro na sincronização do appState
   * @param sessionId ID da sessão
   */
  private markAppStateSyncError(sessionId: string): void {
    const current = this.connectionState.get(sessionId);
    if (!current) return;
    
    current.appStateSyncError = true;
    current.lastAppStateSyncAttempt = new Date();
    this.connectionState.set(sessionId, current);
    
    this.logger.warn(`Erro de sincronização do appState para sessão ${sessionId}`);
  }
  
  /**
   * Verifica se a conexão está pronta para enviar mensagens
   * @param sessionId ID da sessão
   * @param sock Socket do WhatsApp
   * @returns true se a conexão estiver pronta, false caso contrário
   */
  public async isConnectionReady(sessionId: string, sock: WASocket): Promise<boolean> {
    const connectionInfo = this.connectionState.get(sessionId);
    if (!connectionInfo) return false;
    
    // Verificar se a conexão está marcada como conectada
    if (!connectionInfo.isConnected) {
      this.logger.debug(`Conexão para sessão ${sessionId} não está conectada`);
      return false;
    }
    
    // Verificar se o WebSocket está realmente aberto
    if (!sock || !sock.ws || !sock.ws.isOpen) {
      this.logger.warn(`WebSocket para sessão ${sessionId} não está aberto, mas estado indica conexão ativa`);
      // Corrigir estado inconsistente
      this.updateConnectionState(sessionId, false, 'inconsistent', false);
      return false;
    }
    
    // Se a conexão não estiver marcada como pronta, mas estiver conectada há tempo suficiente
    if (!connectionInfo.isReady) {
      const timeSinceUpdate = new Date().getTime() - connectionInfo.lastStateUpdate.getTime();
      if (timeSinceUpdate > this.CONNECTION_READY_TIMEOUT) {
        this.markConnectionReady(sessionId);
        return true;
      }
      return false;
    }
    
    // Verificar se houve atividade recente
    const timeSinceActivity = new Date().getTime() - connectionInfo.lastActivity.getTime();
    if (timeSinceActivity > this.CONNECTION_ACTIVITY_TIMEOUT) {
      // Verificar conexão enviando um ping
      try {
        this.logger.debug(`Verificando conexão para sessão ${sessionId} após ${timeSinceActivity/1000}s de inatividade`);
        // Testar conectividade com uma operação simples
        await sock.updateProfilePicture(sock.user.id, null).catch(() => {});
        
        // Atualizar timestamp de atividade
        connectionInfo.lastActivity = new Date();
        this.connectionState.set(sessionId, connectionInfo);
        return true;
      } catch (error) {
        this.logger.warn(`Falha ao verificar conexão para sessão ${sessionId}: ${error.message}`);
        // Corrigir estado inconsistente
        this.updateConnectionState(sessionId, false, 'stale', false);
        return false;
      }
    }
    
    
    return true;
  }
  /**
   * Inicializa o estado da conexão para uma sessão
   * @param sessionId ID da sessão
   */
  private initializeConnectionState(sessionId: string): void {
    this.connectionState.set(sessionId, {
      isConnected: false,
      connectionState: 'initializing',
      lastStateUpdate: new Date(),
      connectionTries: 0,
      isReady: false,
      lastActivity: new Date(),
      appStateSyncError: false,
      lastAppStateSyncAttempt: new Date()
    });
  }

/**
   * Reseta as informações de reconexão para uma sessão
   * @param sessionId ID da sessão
   */
  private resetReconnectionInfo(sessionId: string): void {
    // Limpar qualquer timer existente
    const currentInfo = this.reconnectionInfo.get(sessionId);
    if (currentInfo?.intervalId) {
      clearTimeout(currentInfo.intervalId);
    }
    
    // Definir novas informações de reconexão
    this.reconnectionInfo.set(sessionId, {
      attempts: 0,
      lastAttempt: new Date()
    });
  }

  /**
   * Calcula o atraso para a próxima tentativa de reconexão usando backoff exponencial
   * @param sessionId ID da sessão
   * @returns Tempo de espera em milissegundos
   */
  private calculateReconnectionDelay(sessionId: string): number {
    const info = this.reconnectionInfo.get(sessionId);
    if (!info) return this.BASE_RECONNECT_DELAY_MS;
    
    info.attempts += 1;
    info.lastAttempt = new Date();
    
    // Cálculo de backoff exponencial: delay_base * 2^attempt
    // Exemplo: 5000ms * 2^3 = 40000ms (40 segundos) na quarta tentativa
    const delay = Math.min(
      this.BASE_RECONNECT_DELAY_MS * Math.pow(2, info.attempts - 1),
      this.MAX_RECONNECT_DELAY_MS
    );
    
    // Adicionar jitter (variação aleatória) para evitar tempestades de reconexão
    const jitter = Math.random() * 0.3 * delay; // até 30% de variação
    
    return Math.floor(delay + jitter);
  }

  /**
   * Configura todos os listeners necessários para o socket
   * @param sock Socket do WhatsApp
   * @param sessionId ID da sessão
   * @param onUpdate Callback para atualizar o estado da sessão
   * @param saveCreds Função para salvar credenciais
   */
  private setupListeners(
    sock: WASocket,
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void,
    saveCreds: () => Promise<void>,
  ): void {
    this.logger.debug(`Configurando listeners para sessão: ${sessionId}`);
    const firstQR = { value: true };

    // Configurar listener de QR Code
    this.eventService.setupQRCodeListener(sock, sessionId, onUpdate, firstQR);
    
    // Configurar listener de credenciais
    this.eventService.setupCredentialsListener(sock, sessionId, saveCreds);
    
    // Configurar listener de estado da conexão
    this.eventService.setupConnectionStateListener(sock, sessionId, onUpdate);
    
    // Configurar listener de mensagens
    this.eventService.setupMessageListener(sock, sessionId, this.messageService);
    
    // Configurar listener de reconexão
    this.setupReconnectionListener(sock, sessionId, onUpdate);
    
    // Monitorar recursos websocket
    this.monitorWebSocketResources(sock, sessionId);
  }

  /**
   * Configura o listener de reconexão com backoff exponencial
   * @param sock Socket do WhatsApp
   * @param sessionId ID da sessão
   * @param onUpdate Callback para atualizar o estado da sessão
   */
  private setupReconnectionListener(
    sock: WASocket,
    sessionId: string,
    onUpdate: (sessionData: Partial<IWhatsAppSessionData>) => void,
  ): void {
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      this.logger.debug(`Estado da conexão atualizado: ${connection || 'desconhecido'}`);
      
      // Quando a conexão mudar para aberta
      if (connection === 'open') {
        this.logger.log(`Conexão estabelecida com sucesso para sessão ${sessionId}`);
        this.updateConnectionState(sessionId, true, 'connected');
        
        // Resetar contador de tentativas
        this.resetReconnectionInfo(sessionId);
        
        // Atualizar estado da sessão
        onUpdate({ connected: true, qrCode: undefined });
      } 
      // Quando a conexão for fechada
      else if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = (lastDisconnect?.error as Boom)?.message || 'Desconhecido';
        
        // Determinar se deve reconectar (não reconectar apenas em caso de logout)
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        this.logger.error(
          `Conexão fechada para sessão ${sessionId}. Status: ${statusCode}, Erro: ${errorMessage}`,
          (lastDisconnect?.error as Error)?.stack
        );
        
        // Atualizar estado da conexão
        this.updateConnectionState(sessionId, false, 'disconnected');
        
        // Atualizar estado da sessão
        onUpdate({ connected: false });

        // Verificar se deve reconectar
        if (shouldReconnect) {
          // Obter informações de reconexão
          const reconnectionInfo = this.reconnectionInfo.get(sessionId) || { 
            attempts: 0, 
            lastAttempt: new Date() 
          };
          
          // Verificar se excedeu o número máximo de tentativas
          if (reconnectionInfo.attempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.logger.error(`Número máximo de tentativas de reconexão (${this.MAX_RECONNECT_ATTEMPTS}) excedido para sessão ${sessionId}`);
            return;
          }
          
          // Calcular atraso com backoff exponencial
          const reconnectDelay = this.calculateReconnectionDelay(sessionId);
          
          this.logger.warn(`Reconectando sessão ${sessionId} após ${reconnectDelay/1000} segundos...`);
          
          // Agendar reconexão
          const intervalId = setTimeout(async () => {
            try {
              this.logger.log(`Executando reconexão agendada para sessão ${sessionId}`);
              await this.createConnection(sessionId, onUpdate, true);
            } catch (error) {
              this.logger.error(
                `Falha na reconexão agendada para sessão ${sessionId}: ${error.message}`,
                error.stack
              );
              
              // Se falhar e ainda não atingiu o limite máximo, tenta novamente
              if (reconnectionInfo.attempts < this.MAX_RECONNECT_ATTEMPTS) {
                // Calcular um novo atraso ainda maior
                const newDelay = this.calculateReconnectionDelay(sessionId);
                this.logger.warn(`Agendando nova tentativa para sessão ${sessionId} em ${newDelay/1000} segundos após falha...`);
                
                setTimeout(() => {
                  this.setupReconnectionListener(sock, sessionId, onUpdate);
                }, newDelay);
              }
            }
          }, reconnectDelay);
          
          // Atualizar informações de reconexão com o ID do intervalo
          reconnectionInfo.intervalId = intervalId;
          this.reconnectionInfo.set(sessionId, reconnectionInfo);
        } else {
          // Caso seja logout ou desconexão permanente
          this.logger.warn(`Sessão ${sessionId} desconectada permanentemente (logout)`);
          
          // Limpar informações de reconexão
          this.reconnectionInfo.delete(sessionId);
          
          // Atualizar estado para desconectado permanentemente
          this.updateConnectionState(sessionId, false, 'logged-out');
        }
      }
    });
  }

  /**
   * Monitora recursos do WebSocket para detecção de problemas
   * @param sock Socket do WhatsApp
   * @param sessionId ID da sessão
   */
  private monitorWebSocketResources(sock: WASocket, sessionId: string): void {
    // Verificar status da conexão periodicamente
    const interval = setInterval(() => {
      try {
        if (!sock || !sock.ws) {
          this.logger.warn(`[Monitor] WebSocket não existe para sessão ${sessionId}`);
          clearInterval(interval);
          return;
        }
        
        // Verificar estado do WebSocket usando os métodos disponíveis
        const isOpen = sock.ws.isOpen;
        if (!isOpen) {
          this.logger.warn(
            `[Monitor] WebSocket não está aberto para sessão ${sessionId}. Estado: ${
              sock.ws.isConnecting ? 'CONNECTING' :
              sock.ws.isClosing ? 'CLOSING' :
              !sock.ws.isOpen ? 'CLOSED' : 'DESCONHECIDO'
            }`
          );
        } else {
          this.logger.debug(`[Monitor] WebSocket está conectado para sessão ${sessionId}`);
        }
      } catch (error) {
        this.logger.error(
          `[Monitor] Erro ao verificar status do WebSocket para sessão ${sessionId}: ${error.message}`,
          error.stack
        );
        clearInterval(interval);
      }
    }, this.CONNECTION_MONITOR_INTERVAL_MS);

    // Limpar o intervalo quando a conexão for fechada
    sock.ev.on('connection.update', ({ connection }) => {
      if (connection === 'close') {
        clearInterval(interval);
        this.logger.debug(`[Monitor] Monitoramento encerrado para sessão ${sessionId}`);
      }
    });
  }

  /**
   * Encerra uma conexão do WhatsApp
   * @param sock Socket do WhatsApp
   * @param sessionId ID da sessão 
   */
  async closeConnection(sock: WASocket, sessionId: string): Promise<void> {
    this.logger.log(`Encerrando conexão da sessão ${sessionId}`);
    
    try {
      // Limpar qualquer timer de reconexão pendente
      const reconnectionInfo = this.reconnectionInfo.get(sessionId);
      if (reconnectionInfo?.intervalId) {
        clearTimeout(reconnectionInfo.intervalId);
      }
      
      // Remover listeners de cada tipo de evento
      const events: Array<keyof BaileysEventMap> = [
        'connection.update',
        'creds.update',
        'messages.upsert',
        'presence.update',
        'chats.upsert',
        'contacts.upsert',
        'groups.upsert'
      ];
      
      // Remover todos os listeners para cada tipo de evento
      events.forEach(event => {
        sock.ev.removeAllListeners(event);
      });
      
      // Encerrar socket
      await sock.logout().catch(err => {
        this.logger.warn(`Erro ao fazer logout da sessão ${sessionId}: ${err.message}`);
      });
      
      await sock.end(new Error(`Conexão encerrada manualmente para sessão ${sessionId}`));
      
      // Remover informações de reconexão
      this.reconnectionInfo.delete(sessionId);
      
      this.logger.log(`Conexão da sessão ${sessionId} encerrada com sucesso`);
    } catch (error) {
      this.logger.error(
        `Erro ao encerrar conexão da sessão ${sessionId}: ${error.message}`, 
        error.stack
      );
      throw error;
    }
  }
}
