import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  /**
   * Verifies Cloudflare Turnstile CAPTCHA token.
   * Fails closed on any error, timeout, or unsuccessful verification.
   */
  async verifyTurnstile(token: string, ip: string): Promise<{ success: boolean; error?: string }> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // Bypass in development/test if secret key is not set or dummy bypass token is used
    if (!secretKey || token === 'dummy-bypass-token') {
      return { success: true };
    }

    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Captcha verification failed.' };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', secretKey);
      formData.append('response', token);
      if (ip) {
        formData.append('remoteip', ip);
      }

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`Turnstile API returned HTTP status ${response.status}`);
        return { success: false, error: 'Captcha verification failed.' };
      }

      const data = (await response.json()) as { success?: boolean };
      if (data?.success === true) {
        return { success: true };
      }

      this.logger.warn(`Turnstile verification failed for IP ${ip}`);
      return { success: false, error: 'Captcha verification failed.' };
    } catch (err: any) {
      this.logger.error(`Turnstile verification error / timeout: ${err.message}`);
      return { success: false, error: 'Captcha verification failed.' };
    }
  }
}
