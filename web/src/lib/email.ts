import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "SOULDAWN <noreply@souldawn.com>";

/**
 * Send a verification code email.
 * Falls back to console.log if no RESEND_API_KEY.
 * Returns true if sent (or fallback), false on real error.
 */
export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ sent: boolean; fallback?: boolean }> {
  const subject = `Код подтверждения SOULDAWN: ${code}`;
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;background:#0A0A0D;color:#E8E8F0;padding:40px 32px;border:1px solid rgba(200,200,210,0.1);">
      <div style="text-align:center;margin-bottom:32px;">
        <p style="font-size:11px;letter-spacing:0.35em;font-weight:900;text-transform:uppercase;color:rgba(232,232,240,0.3);margin:0;">SOUL</p>
        <p style="font-size:11px;letter-spacing:0.35em;font-weight:900;text-transform:uppercase;color:rgba(200,200,208,0.2);margin:0;">DAWN</p>
      </div>
      <p style="font-size:14px;color:#6B6B78;margin-bottom:24px;">Ваш код подтверждения:</p>
      <div style="background:rgba(200,200,210,0.06);border:1px solid rgba(200,200,210,0.1);padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:900;letter-spacing:8px;color:#C8C8D0;">${code}</span>
      </div>
      <p style="font-size:12px;color:#6B6B78;line-height:1.6;">
        Если вы не запрашивали этот код, проигнорируйте это письмо.<br/>
        Код действителен 10 минут.
      </p>
    </div>
  `;

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject,
        html,
      });
      if (error) {
        console.error("[resend] error:", error);
        return { sent: false };
      }
      return { sent: true };
    } catch (err) {
      console.error("[resend] exception:", err);
      return { sent: false };
    }
  }

  // No API key — fallback: log to console (dev mode)
  console.log(`\n📧 EMAIL VERIFICATION CODE for ${to}: ${code}\n`);
  return { sent: true, fallback: true };
}