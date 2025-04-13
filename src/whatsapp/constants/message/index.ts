export const MESSAGE_CONSTANTS = {
  MESSAGE_TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
  },

  MESSAGE_LIMITS: {
    MAX_TEXT_LENGTH: 4096,
    MAX_CAPTION_LENGTH: 1024,
    MAX_MEDIA_SIZE: 16 * 1024 * 1024,
    MAX_QUEUE_SIZE: 100,
  },

  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },

  VALID_MEDIA_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    VIDEO: ['video/mp4', 'video/quicktime', 'video/3gpp'],
    AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg'],
    DOCUMENT: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  SUPPORTED_FORMATS: {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    VIDEO: ['mp4', 'mov', '3gp'],
    AUDIO: ['mp3', 'wav', 'ogg'],
    DOCUMENT: ['pdf', 'doc', 'docx'],
  },
};

export const MESSAGE_ERRORS = {
  VALIDATION: {
    INVALID_NUMBER: 'Número de telefone inválido',
    EMPTY_MESSAGE: 'Mensagem não pode estar vazia',
    INVALID_MEDIA: 'Arquivo de mídia inválido',
    MESSAGE_TOO_LONG: 'Mensagem excede o limite de caracteres',
    CAPTION_TOO_LONG: 'Legenda excede o limite de caracteres',
  },
  SEND: {
    FAILED: 'Falha ao enviar mensagem',
    MEDIA_FAILED: 'Falha ao enviar mídia',
    NETWORK_ERROR: 'Erro de rede ao enviar mensagem',
  },
};
