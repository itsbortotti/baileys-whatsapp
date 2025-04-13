import * as session from 'express-session';

import { Logger } from '@nestjs/common';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const logger = new Logger('RedisConfig');

// Criar cliente Redis com as configurações apropriadas
export const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0', 10),
  socket: {
    reconnectStrategy: (retries) => {
      const maxRetries = parseInt(process.env.WA_MAX_RETRIES || '3', 10);
      const reconnectInterval = parseInt(
        process.env.WA_RECONNECT_INTERVAL || '5000',
        10,
      );

      if (retries > maxRetries) {
        logger.error(
          'Número máximo de tentativas de reconexão com o Redis atingido',
        );
        return false;
      }

      const delay = Math.min(retries * reconnectInterval, 20000);
      logger.warn(
        `Tentando reconectar ao Redis em ${delay}ms... Tentativa ${retries}`,
      );
      return delay;
    },
  },
});

// Configurar listeners de eventos do Redis
redisClient.on('connect', () => {
  logger.log('Conectado ao Redis com sucesso');
});

redisClient.on('error', (error) => {
  logger.error('Erro na conexão com Redis:', error.message);
});

// Inicializar a conexão com o Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(
      'Erro ao conectar com Redis:',
      error instanceof Error ? error.message : String(error),
    );
  }
})();

// Criar instância do RedisStore para sessões
const store = new RedisStore({
  client: redisClient,
  prefix: 'whatsapp-session:',
}) as session.Store;

// Configurações da sessão
export const sessionOptions: session.SessionOptions = {
  store,
  secret:
    process.env.SESSION_SECRET ||
    'whatsapp-baileys-secret-key-change-me-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: process.env.SESSION_NAME || 'whatsapp.sid',
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 horas por padrão
  },
};

// Middleware de sessão
export const sessionMiddleware = session(sessionOptions);

// Função para fechar a conexão com o Redis
export async function closeRedisConnection(): Promise<void> {
  try {
    await redisClient.quit();
    logger.log('Conexão com Redis encerrada');
  } catch (error) {
    logger.error(
      'Erro ao encerrar conexão com Redis:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// Exportar o cliente Redis como default
export default redisClient;
