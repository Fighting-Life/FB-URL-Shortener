import { BETTER_AUTH_SECRET } from '$env/static/private';
import * as crypto from 'crypto';

interface TrackingPayload {
  click: boolean;
  aem: string;
  app_id: string;
  timestamp: number;
}

class TokenGenerator {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }


  private toBase64Url(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }


  public generateToken(payload: TrackingPayload): string {

    const dataString = `click:${payload.click}|aem:${payload.aem}|app_id:${payload.app_id}|ts:${payload.timestamp}`;
    const dataBuffer = Buffer.from(dataString, 'utf-8');
    const encodedData = this.toBase64Url(dataBuffer);

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(dataString)
      .digest();
    const encodedSignature = this.toBase64Url(signature);

    return `${encodedData}_aem_${encodedSignature}`;
  }
}

export const tokenGenerator = new TokenGenerator(BETTER_AUTH_SECRET)