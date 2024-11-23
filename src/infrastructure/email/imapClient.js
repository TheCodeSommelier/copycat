import Imap from "imap";
import logger from "../../services/loggerService.js";
import SecureEmailParser from "./emailParser.js";
import { imapConfig } from "../../../config.js";
import { simpleParser } from "mailparser";

export default class ImapClient {
  constructor() {
    this.imap = new Imap(imapConfig);
    this.emailParser = new SecureEmailParser({
      allowedDomains: ["tony-masek.com"], // Any allowed sender domains here
      maxSize: 15 * 1024 * 1024, // 15MB
    });
    this.setupEventListeners();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", resolve);
      this.imap.once("error", reject);
      this.imap.connect();
    });
  }

  disconnect() {
    this.imap.end();
  }

  setupEventListeners() {
    this.imap.on("error", (err) => {
      logger.error("🛑 IMAP Error:", err.message || err);
    });

    this.imap.on("end", () => {
      logger.info("👋 IMAP connection ended");
    });

    this.imap.on("close", (hadError) => {
      logger.info("🔒 IMAP connection closed", { hadError });
    });

    this.imap.on("ready", () => {
      logger.info("✅ You are in bud!");
      this.watchInbox(this.emailHandler);
      logger.info("👀 Watching the inbox!");
    });

    this.imap.on("connect", () => {
      logger.info("🔌 Raw connection");
    });

    this.imap.on("alert", (alert) => {
      logger.error(`⚠️ IMAP Alert: ${alert}`);
    });

    this.imap.on("debug", (info) => {
      logger.info(`🔍 IMAP Debug: ${info}`);
    });
  }

  emailHandler(err, email) {
    if (err) {
      console.error("Error processing email:", err);
      return;
    }

    console.log("New Email Received:");
    console.log("From:", email.from);
    console.log("Subject:", email.subject);
    console.log("Text:", email.text);
    console.log("HTML:", email.html);
  }

  watchInbox(callback) {
    this.imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        logger.error("Error opening inbox:", err);
        return;
      }

      // Listen for new emails
      this.imap.on("mail", () => {
        this.#fetchNewEmails(box.messages.total, callback);
      });
    });
  }

  // Private functions

  async #fetchNewEmails(numNew, callback) {
    try {
      const fetchEmail = this.imap.seq.fetch(`${numNew}:*`, {
        bodies: "",  // Fetch the entire message
        struct: true,
      });

      fetchEmail.on("message", (msg) => {
        msg.on("body", async (stream) => {
          try {
            // First parse the raw email using mailparser
            const parsedEmail = await simpleParser(stream);

            // Prepare the email data in the correct format
            const emailData = {
              text: parsedEmail.text,
              html: parsedEmail.html,
              subject: parsedEmail.subject,
              from: parsedEmail.from,
              to: parsedEmail.to,
              attachments: parsedEmail.attachments,
              date: parsedEmail.date
            };

            // Now pass the properly parsed email to SecureEmailParser
            const secureEmail = await this.emailParser.parse(emailData);
            callback(null, secureEmail);
          } catch (error) {
            logger.error("Error parsing email:", error);
            callback(error);
          }
        });
      });

      fetchEmail.once("error", (err) => {
        logger.error("Fetch error:", err);
        callback(err);
      });

    } catch (error) {
      logger.error("Fatal fetch error:", error);
      callback(error);
    }
  }
}
