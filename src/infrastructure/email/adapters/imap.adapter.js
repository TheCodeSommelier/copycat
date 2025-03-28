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
    this.maxReconnectionAttempts = 10;
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

  async #emitErrorEvent(message) {
    this.isConnected = false;
    this.imap.end();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const error = new Error(message);
    error.source = "socket";
    error.code = "ECONNRESET";
    this.imap.emit("error", error);
  }

  async #connect() {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        this.isConnected = true;
        this.maxReconnectionAttempts = 10;
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

    this.imap.on("error", async (err) => {
      this.logger.error("IMAP Error:", err);

      if (!this.isConnected && this.maxReconnectionAttempts > 0) {
        this.#reconnect();
      }
    });

    this.imap.on("end", () => {
      this.isConnected = false;
      this.logger.info("IMAP connection ended");
    });

    this.imap.on("close", (hadError) => {
      this.isConnected = false;
      this.logger.warn("IMAP connection closed", { hadError });
      this.#reconnect();
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

            if (!/\w+\s+Alert:\s+\w+(?:\/)?(?:\w+)/gi.test(preParsed.subject)) {
              this.logger.warn("Non-trade email...");
              return;
            }

            const secureEmail = await this.emailParser.parse(preParsed);

            this.handlers.forEach((handler) => handler(secureEmail));
          } catch (error) {
            this.logger.error("Error parsing email:", error);
            throw error;
          }
        });
      });
    } catch (error) {
      this.logger.error("Fatal fetch error:", error);
    }
  }

  async #reconnect() {
    const delay = (10 - this.maxReconnectionAttempts) * 2000;
    this.logger.info(
      `Attempting to reconnect in ${delay / 1000} seconds... (${this.maxReconnectionAttempts} attempts remaining)`
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.monitorEmails();
      this.maxReconnectionAttempts--;
    } catch (error) {
      this.logger.error("Reconnection failed:", error);
      if (this.maxReconnectionAttempts <= 1) {
        this.logger.error("Max reconnection attempts reached");
        throw new Error("Failed to reconnect after maximum attempts");
      }
    }
  }
}
