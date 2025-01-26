import dotenv from "dotenv";
dotenv.config();

export const imapConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.PASSWORD,
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT),
  tls: true,
  keepalive: true,
};
