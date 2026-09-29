
import { SMTP_FROM_EMAIL, SMTP_FROM_NAME, SMTP_PASSWORD, SMTP_USER } from '$env/static/private';
import nodemailer from 'nodemailer';

export async function sendEmail(payload: Partial<CreateEmailOptions>) {


  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    transporter.verify((error, success) => {
      if (error) {
        throw error;
      }
      console.log('SMTP Server is ready to take messages', success);
    });

    const response = await transporter.sendMail({
      from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
      to: payload.to,
      replyTo: payload.replyTo || SMTP_FROM_EMAIL,
      subject: payload.subject,
      html: payload.html
    });

    return {
      success: true,
      message: 'Email sent successfully',
      data: {
        id: response.messageId
      }
    }

  } catch (error) {
    console.error('[email] Nodemailer error', error);
    throw new Error(error instanceof Error ? error.message : 'Nodemailer error');
  }
}
