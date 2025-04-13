import * as qrcodeTerminal from 'qrcode-terminal';
import * as qrcode from 'qrcode';
import { Logger } from '@nestjs/common';

const logger = new Logger('QRCodeUtil');

/**
 * Opções para exibição do QR code
 */
export interface QRCodeDisplayOptions {
  /** Se deve exibir o QR code no terminal */
  printToTerminal?: boolean;
  /** Se deve gerar uma URL de imagem para o QR code */
  generateImageUrl?: boolean;
  /** Tamanho do QR code gerado */
  size?: number;
}

/**
 * Resultado da geração do QR code
 */
export interface QRCodeResult {
  /** Dados brutos do QR code */
  qrData: string;
  /** URL da imagem do QR code em base64 (opcional) */
  imageUrl?: string;
  /** Endpoints formatados para acesso ao QR code */
  endpoints: {
    api: string;
    web: string;
  };
}

/**
 * Gera e exibe um QR code para conexão do WhatsApp
 * @param qrData String com os dados do QR code
 * @param sessionId ID da sessão associada ao QR code
 * @param options Opções para exibição do QR code
 * @returns Promise com resultado da geração do QR code
 */
export async function generateQRCode(
  qrData: string,
  sessionId: string,
  options: QRCodeDisplayOptions = {},
): Promise<QRCodeResult> {
  const {
    printToTerminal = false,
    generateImageUrl = true,
    size = 200,
  } = options;

  logger.log(
    `QR code gerado para sessão ${sessionId} (${qrData.length} caracteres)`,
  );

  // Log no console com endpoints para acesso
  console.log('[WHATSAPP QR] Sessão: ' + sessionId);
  console.log('[WHATSAPP QR] API: GET /whatsapp/session/' + sessionId + '/qr');
  console.log('[WHATSAPP QR] Web: http://localhost:3000/docs');

  // Exibir QR code no terminal se solicitado
  if (printToTerminal) {
    qrcodeTerminal.generate(qrData, { small: false });
  }

  // Gerar URL da imagem se solicitado
  let imageUrl: string | undefined;
  if (generateImageUrl) {
    try {
      imageUrl = await qrcode.toDataURL(qrData, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch (error) {
      logger.error(`Erro ao gerar imagem QR code: ${error.message}`);
    }
  }

  return {
    qrData,
    imageUrl,
    endpoints: {
      api: `/whatsapp/session/${sessionId}/qr`,
      web: `http://localhost:3000/docs`,
    },
  };
}

/**
 * Constrói um objeto com endpoints para acesso ao QR code
 * @param sessionId ID da sessão
 * @param baseUrl URL base para acesso (opcional)
 * @returns Objeto com endpoints formatados
 */
export function getQRCodeEndpoints(
  sessionId: string,
  baseUrl: string = 'http://localhost:3000',
): { api: string; web: string } {
  return {
    api: `/whatsapp/session/${sessionId}/qr`,
    web: `${baseUrl}/docs`,
  };
}

/**
 * Registra informações do QR code nos logs
 * @param qrData Dados do QR code
 * @param sessionId ID da sessão
 */
export function logQRCodeInfo(qrData: string, sessionId: string): void {
  logger.log(
    `QR code gerado para sessão ${sessionId} (${qrData.length} caracteres)`,
  );

  console.log('[WHATSAPP QR] Sessão: ' + sessionId);
  console.log('[WHATSAPP QR] API: GET /whatsapp/session/' + sessionId + '/qr');
  console.log('[WHATSAPP QR] Web: http://localhost:3000/docs');
}
