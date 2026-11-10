import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private transporter: Transporter | null = null;

  onModuleInit() {
    this.initTransporter();
  }

  /**
   * Initializes the SMTP transporter if credentials exist in environment.
   * Supports free SMTP providers:
   * - Gmail SMTP (smtp.gmail.com, port 465/587 with App Password)
   * - Brevo / Sendinblue (smtp-relay.brevo.com, port 587)
   * - Custom SMTP
   */
  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized using ${host}:${port} (${user})`);
    } else {
      this.logger.warn('SMTP credentials not configured. Falling back to development console logging.');
    }
  }

  /**
   * Finds the official ARM Exhaust logo asset path dynamically.
   */
  private getLogoPath(): string | null {
    const candidatePaths = [
      path.resolve(process.cwd(), 'assets/logo-arm.png'),
      path.resolve(process.cwd(), 'backend/assets/logo-arm.png'),
      path.resolve(__dirname, '../../../assets/logo-arm.png'),
      path.resolve(__dirname, '../../assets/logo-arm.png'),
      path.resolve(process.cwd(), 'frontend/public/assets/Logo ARM no BG.png'),
      path.resolve(process.cwd(), '../frontend/public/assets/Logo ARM no BG.png'),
    ];

    return candidatePaths.find((p) => fs.existsSync(p)) || null;
  }

  /**
   * Sends OTP email via SMTP if configured, or logs to console in development.
   */
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const from = process.env.SMTP_FROM || `"ARM Exhaust" <${process.env.SMTP_USER || 'no-reply@armexhaust.id'}>`;
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${appUrl}/login?email=${encodeURIComponent(email)}&otp=${otp}&auto=1`;

    // Structured logging for observability & dev debugging
    this.logger.log(`[mailer] Verification OTP for ${email}: ${otp}`);

    if (this.transporter) {
      try {
        const logoPath = this.getLogoPath();
        const attachments: nodemailer.SendMailOptions['attachments'] = [];

        let headerBrandHtml: string;
        if (logoPath) {
          attachments.push({
            filename: 'logo-arm.png',
            path: logoPath,
            cid: 'armlogo',
          });
          headerBrandHtml = `
            <div style="text-align: center; margin-bottom: 22px;">
              <img src="cid:armlogo" alt="ARM Exhaust" width="130" style="max-width: 130px; height: auto; display: inline-block; border: 0; outline: none;" />
            </div>
          `;
        } else {
          headerBrandHtml = `
            <div style="text-align: center; margin-bottom: 22px;">
              <h1 style="color: #E81828; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 2px;">ARM EXHAUST</h1>
              <p style="color: #8A8F98; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Racing & Performance Systems</p>
            </div>
          `;
        }

        await this.transporter.sendMail({
          from,
          to: email,
          subject: `${otp} is your ARM Exhaust verification code`,
          text: `Your ARM Exhaust verification code is: ${otp}. This code is valid for 15 minutes. Verify instantly at: ${verifyUrl}`,
          attachments,
          html: `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0C" style="background-color: #0A0A0C; margin: 0; padding: 28px 12px; width: 100%;">
              <tr>
                <td align="center">
                  <!-- Main Card Container -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; background-color: #0F0F11; border: 1px solid #26262B; border-top: 3px solid #E81828; border-radius: 10px; overflow: hidden; padding: 30px 22px;">
                    <tr>
                      <td align="center">
                        ${headerBrandHtml}

                        <!-- Inner Telemetry Panel -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #141416; border: 1px solid #28282D; border-radius: 8px;">
                          <tr>
                            <td align="center" style="padding: 24px 20px;">
                              <!-- Eyebrow -->
                              <p style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; color: #9AA0A8; text-transform: uppercase; letter-spacing: 1.5px;">
                                Registration Verification Code
                              </p>
                              
                              <!-- Monospace OTP Display -->
                              <div style="display: inline-block; background-color: #18181C; padding: 13px 24px; border-radius: 6px; border: 1px solid #E81828; font-family: 'SF Mono', 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #FFFFFF; user-select: all; -webkit-user-select: all; cursor: copy;" title="Click code to select all">
                                ${otp}
                              </div>

                              <!-- Instruction -->
                              <p style="margin: 10px 0 22px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #71717A;">
                                Click code to highlight &bull; Expires in <strong>15 minutes</strong>
                              </p>

                              <!-- 1-Click Verification CTA -->
                              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                  <td align="center" bgcolor="#E81828" style="border-radius: 6px;">
                                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 13px 30px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; color: #FFFFFF; text-decoration: none; text-transform: uppercase; letter-spacing: 1.2px; border-radius: 6px; border: 1px solid #FF2B3C;">
                                      Verify Account Instantly &rarr;
                                    </a>
                                  </td>
                                </tr>
                              </table>

                              <!-- Security Advisory Notice -->
                              <p style="margin: 20px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #8A8F98; line-height: 1.5;">
                                Never share this code with anyone. ARM Exhaust staff will never ask for your verification code or password.
                              </p>
                            </td>
                          </tr>
                        </table>

                        <!-- Security Metadata Telemetry -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px;">
                          <tr>
                            <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; color: #52525B; letter-spacing: 0.5px; text-transform: uppercase;">
                              Single-Use Security Token &bull; 256-Bit TLS Protected
                            </td>
                          </tr>
                        </table>

                        <!-- Footer -->
                        <p style="margin: 18px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #52525B; text-align: center; line-height: 1.5;">
                          If you did not initiate this registration, please disregard this email.<br />
                          &copy; ${new Date().getFullYear()} ARM Exhaust. Racing &amp; Performance Systems.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `,
        });
        this.logger.log(`SMTP email sent successfully to ${email}`);
      } catch (err: any) {
        this.logger.error(`Failed to send email via SMTP to ${email}: ${err.message}`);
      }
    }
  }
}
