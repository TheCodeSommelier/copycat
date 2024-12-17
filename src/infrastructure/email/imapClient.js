import Imap from "imap";
import EventEmitter from "events";
import logger from "../../services/loggerService.js";
import SecureEmailParser from "./secureEmailParser.js";
import { imapConfig } from "../../config/imap.js";
import { simpleParser } from "mailparser";

/**
 * The ImapClient inherits from the EventEmitter from the events lib.
 * So that it is ale to emit events when a new email comes.
 */
export default class ImapClient extends EventEmitter {
  constructor() {
    super();
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
      this.watchInbox();
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

  watchInbox() {
    this.imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        logger.error("Error opening inbox:", err);
        return;
      }

      this.imap.on("mail", () => {
        this.#fetchNewEmails(box.messages.total);
      });
    });
  }

  // Private functions

  async #fetchNewEmails(numNew) {
    try {
      const fetchEmail = this.imap.seq.fetch(`${numNew}:*`, {
        bodies: "", // Fetch the entire message
        struct: true,
      });

      fetchEmail.on("message", (msg) => {
        msg.on("body", async (stream) => {
          try {
            const parsedEmail = await simpleParser(stream);

            const emailData = {
              text: parsedEmail.text,
              html: parsedEmail.html,
              subject: parsedEmail.subject,
              from: parsedEmail.from,
              to: parsedEmail.to,
              attachments: parsedEmail.attachments,
              date: parsedEmail.date,
            };

            const secureEmail = await this.emailParser.parse(emailData);
            this.emit("newEmail", secureEmail);
          } catch (error) {
            logger.error("Error parsing email:", error);
          }
        });
      });

      fetchEmail.once("error", (err) => {
        logger.error("Fetch error:", err);
      });
    } catch (error) {
      logger.error("Fatal fetch error:", error);
    }
  }
}
