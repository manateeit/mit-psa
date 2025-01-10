import nodemailer from 'nodemailer'; 
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

import logger from '../logger';
import { getSecret } from '../../lib/utils/getSecret';

const EMAIL_FROM = process.env.EMAIL_FROM as string;
const EMAIL_HOST = process.env.EMAIL_HOST as string;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT as string, 10);
const EMAIL_USERNAME = process.env.EMAIL_USERNAME as string;
const EMAIL_PASSWORD = getSecret('email_password', 'EMAIL_PASSWORD');
const APP_HOST = process.env.HOST as string;

type EmailTemplateData = { [key: string]: string }

interface SendEmailParams {
  toEmail: string;
  subject: string;
  templateName: string;
  templateData: EmailTemplateData;
}


const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // Only use secure for port 465
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD,
  },
});

const EMAIL_ENABLE = process.env.EMAIL_ENABLE === 'true';


export async function sendEmail({
  toEmail,
  subject,
  templateName,
  templateData,
}: SendEmailParams): Promise<boolean>{
    try {
        if (!EMAIL_ENABLE) {
            logger.warning('Email sending is disabled');
            return false;
        }
        logger.system(`Sending email to ${toEmail} with subject: ${subject}`);
        const templatePath = path.resolve('./src/utils/email/templates', `${templateName}.ejs`);
        const template = fs.readFileSync(templatePath, 'utf8');

        const htmlContent = ejs.render(template, {
            ...templateData,
            url_app: process.env.APP_HOST,
            url_master_terms: `${APP_HOST}/master_terms`,
            url_privacy_policy: `${APP_HOST}/privacy_policy`,
            });

        const mailOptions: nodemailer.SendMailOptions = {
            from: EMAIL_FROM,
            to: toEmail,
            subject: subject,
            html: htmlContent,
            };


        await transporter.sendMail(mailOptions);
        logger.system(`Email sent success to ${toEmail} with subject: ${subject}`);
        return true;
    } catch (error) {
        logger.error('Failed to send email:', error);
        return false;
    }
}
