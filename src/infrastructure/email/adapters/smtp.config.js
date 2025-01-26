import dotenv from "dotenv";
dotenv.config();

export const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  },
};
