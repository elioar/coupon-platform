import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  locale: string = "en"
) {
  const verificationUrl = `${APP_URL}/${locale}/verify-email?token=${token}`

  const translations = {
    en: {
      subject: "Verify your email address",
      greeting: `Hello ${name},`,
      message: "Please verify your email address by clicking the button below:",
      button: "Verify Email",
      alternative: "Or copy and paste this link into your browser:",
      footer: "If you didn't create an account, you can safely ignore this email.",
    },
    el: {
      subject: "Επαληθεύστε τη διεύθυνση email σας",
      greeting: `Γεια σας ${name},`,
      message: "Παρακαλώ επαληθεύστε τη διεύθυνση email σας κάνοντας κλικ στο παρακάτω κουμπί:",
      button: "Επαλήθευση Email",
      alternative: "Ή αντιγράψτε και επικολλήστε αυτόν τον σύνδεσμο στον περιηγητή σας:",
      footer: "Αν δεν δημιουργήσατε λογαριασμό, μπορείτε να αγνοήσετε αυτό το email.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [email],
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html lang="${locale}">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>${t.subject}</title>
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);">
              <tr>
                <td align="center" style="padding: 32px 16px;">
                  <table role="presentation" style="max-width: 520px; width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center;">
                        <div style="display: inline-block; margin-bottom: 16px;">
                          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; backdrop-filter: blur(10px);">
                            <svg style="width: 28px; height: 28px; fill: white;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                          </div>
                        </div>
                        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VibePeek</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 500;">${t.subject}</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="font-size: 16px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600;">${t.greeting}</p>
                        <p style="font-size: 15px; color: #4b5563; margin: 0 0 28px 0; line-height: 1.6;">${t.message}</p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 28px 0;">
                          <tr>
                            <td align="center" style="padding: 0;">
                              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s ease;">${t.button}</a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Alternative Link -->
                        <div style="margin-top: 28px; padding: 18px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                          <p style="font-size: 13px; color: #6b7280; margin: 0 0 10px 0; font-weight: 500;">${t.alternative}</p>
                          <p style="font-size: 11px; color: #059669; margin: 0; word-break: break-all; font-family: 'Courier New', monospace; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #d1fae5;">${verificationUrl}</p>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.5;">${t.footer}</p>
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="font-size: 12px; color: #d1d5db; margin: 0;">© ${new Date().getFullYear()} VibePeek. All rights reserved.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending verification email:", error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    throw error
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
  locale: string = "en"
) {
  const resetUrl = `${APP_URL}/${locale}/reset-password?token=${token}`

  const translations = {
    en: {
      subject: "Reset your password",
      greeting: `Hello ${name},`,
      message: "You requested to reset your password. Click the button below to create a new password:",
      button: "Reset Password",
      alternative: "Or copy and paste this link into your browser:",
      warning: "This link will expire in 1 hour.",
      footer: "If you didn't request a password reset, you can safely ignore this email.",
    },
    el: {
      subject: "Επαναφορά κωδικού πρόσβασης",
      greeting: `Γεια σας ${name},`,
      message: "Ζητήσατε επαναφορά του κωδικού πρόσβασής σας. Κάντε κλικ στο παρακάτω κουμπί για να δημιουργήσετε νέο κωδικό:",
      button: "Επαναφορά Κωδικού",
      alternative: "Ή αντιγράψτε και επικολλήστε αυτόν τον σύνδεσμο στον περιηγητή σας:",
      warning: "Αυτός ο σύνδεσμος θα λήξει σε 1 ώρα.",
      footer: "Αν δεν ζητήσατε επαναφορά κωδικού, μπορείτε να αγνοήσετε αυτό το email.",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [email],
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html lang="${locale}">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>${t.subject}</title>
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);">
              <tr>
                <td align="center" style="padding: 32px 16px;">
                  <table role="presentation" style="max-width: 520px; width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
                        <div style="display: inline-block; margin-bottom: 16px;">
                          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; backdrop-filter: blur(10px);">
                            <svg style="width: 28px; height: 28px; fill: white;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                          </div>
                        </div>
                        <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VibePeek</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 500;">${t.subject}</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="font-size: 16px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600;">${t.greeting}</p>
                        <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">${t.message}</p>
                        
                        <!-- Warning Box -->
                        <div style="margin-bottom: 24px; padding: 14px 16px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6; display: flex; align-items: center; gap: 10px;">
                          <svg style="width: 18px; height: 18px; fill: #3b82f6; flex-shrink: 0;" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <p style="font-size: 13px; color: #1e40af; margin: 0; font-weight: 500;">${t.warning}</p>
                        </div>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 28px 0;">
                          <tr>
                            <td align="center" style="padding: 0;">
                              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s ease;">${t.button}</a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Alternative Link -->
                        <div style="margin-top: 28px; padding: 18px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                          <p style="font-size: 13px; color: #6b7280; margin: 0 0 10px 0; font-weight: 500;">${t.alternative}</p>
                          <p style="font-size: 11px; color: #2563eb; margin: 0; word-break: break-all; font-family: 'Courier New', monospace; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">${resetUrl}</p>
                        </div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.5;">${t.footer}</p>
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="font-size: 12px; color: #d1d5db; margin: 0;">© ${new Date().getFullYear()} VibePeek. All rights reserved.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error sending password reset email:", error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    throw error
  }
}

