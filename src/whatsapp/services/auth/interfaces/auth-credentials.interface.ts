import { AuthenticationCreds } from '@whiskeysockets/baileys';

export interface CredentialsManager {
  loadCredentials(sessionId: string): Promise<AuthenticationCreds>;

  saveCredentials(sessionId: string, creds: AuthenticationCreds): Promise<void>;

  createSaveCredentialsCallback(
    sessionId: string,
    creds: AuthenticationCreds,
  ): () => Promise<void>;
}
