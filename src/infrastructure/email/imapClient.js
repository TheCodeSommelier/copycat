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
    this.emailParser = new SecureEmailParser();
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
      logger.warn("🔒 IMAP connection closed", { hadError });
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
            const preParsedEmail = await simpleParser(stream);

            logger.info("Parsed email => ", preParsedEmail);

            const emailData = {
              text: preParsedEmail.text,
              html: preParsedEmail.html,
              subject: preParsedEmail.subject,
              from: preParsedEmail.from,
              to: preParsedEmail.to,
              attachments: preParsedEmail.attachments,
              date: preParsedEmail.date,
            };

            // Guard clause saying if not a trade alert email abort
            if (!/\w+\s+alert|Alert:\s+\w{0,}\/\w{0,}/g.test(emailData.subject)) {
              logger.info("⚠️ This is not a trade alert email...");
              return;
            }

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
