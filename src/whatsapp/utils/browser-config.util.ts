import { WA_VERSION } from '../constants/whatsapp.constants';
import { Logger } from '@nestjs/common';

const logger = new Logger('BrowserConfigUtil');

export type SupportedOS = 'Windows' | 'macOS' | 'Linux' | 'Unknown';

export type BrowserConfig = [string, string, string];

export function detectOS(): { platform: string; name: SupportedOS } {
  const platform = process.platform;

  const platformMap: Record<string, SupportedOS> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
  };

  const name = platformMap[platform] || 'Unknown';

  return { platform, name };
}

export function getBrowserConfig(): BrowserConfig {
  const { name } = detectOS();

  switch (name) {
    case 'macOS':
      return ['Chrome', WA_VERSION.CHROME.MAC, 'macOS'];
    case 'Linux':
      return ['Chrome', WA_VERSION.CHROME.LINUX, 'Linux'];
    case 'Windows':
    default:
      return ['Chrome', WA_VERSION.CHROME.WINDOWS, 'Windows'];
  }
}

export function logBrowserConfig(): void {
  const { name } = detectOS();
  const browserConfig = getBrowserConfig();

  logger.log(`Sistema detectado: ${name}`);
  logger.log(
    `Usando WhatsApp Web versão ${browserConfig[1]} no ${browserConfig[2]}`,
  );
}
