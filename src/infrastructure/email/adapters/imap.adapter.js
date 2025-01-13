import Imap from "imap";
import { simpleParser } from "mailparser";
import { ImapPort } from "../../../core/ports/imap.port.js";

export default class ImapAdapter extends ImapPort {
  constructor(config, logger, emailParser) {
    super();
    this.imap = new Imap(config);
    this.logger = logger;
    this.emailParser = emailParser;
    this.isConnected = false;
    this.handlers = new Set();
    this.#setupEventListeners();
  }

  async monitorEmails() {
    await this.#connect();
    this.#watchInbox();
    this.logger.info("Watching the inbox...");
  }

  async stopMonitoring() {
    this.imap.end();
  }

  onTradeSignal(handler) {
    this.handlers.add(handler);
  }

  isConnected() {
    return this.isConnected;
  }

  // Private

  async #connect() {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        this.isConnected = true;
        resolve();
      });
      this.imap.once("error", reject);
      this.imap.connect();
    });
  }

  #setupEventListeners() {
    this.imap.on("ready", () => {
      this.logger.info("You are in!");
    });

    this.imap.on("error", (err) => {
      this.logger.error("IMAP Error:", err);
    });

    this.imap.on("end", () => {
      this.isConnected = false;
      this.logger.info("IMAP connection ended");
    });

    this.imap.on("close", (hadError) => {
      this.isConnected = false;
      this.logger.warn("IMAP connection closed", { hadError });
    });
  }

  async #watchInbox() {
    this.imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        this.logger.error("Error opening inbox:", err);
        return;
      }

      this.imap.on("mail", () => {
        this.#fetchNewEmails(box.messages.total);
      });
    });
  }

  #fetchNewEmails(numNew) {
    try {
      const fetch = this.imap.seq.fetch(`${numNew}:*`, {
        bodies: "",
        struct: true,
      });

      fetch.on("message", (msg) => {
        msg.on("body", async (stream) => {
          try {
            const preParsed = await simpleParser(stream);

            if (
              !/\w+\s+Alert:\s+\w{0,}\/\w{0,}/ig.test(preParsed.subject)
            ) {
              return;
            }

            const secureEmail = await this.emailParser.parse(preParsed);
            this.handlers.forEach((handler) => handler(secureEmail));
          } catch (error) {
            this.logger.error("Error parsing email:", error);
          }
        });
      });
    } catch (error) {
      this.logger.error("Fatal fetch error:", error);
    }
  }
}
