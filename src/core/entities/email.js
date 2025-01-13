import { decode } from "html-entities";
import dotenv from "dotenv";
import logger from "../../infrastructure/logger/logger.js";
import { isProduction } from "../../constants.js";
dotenv.config();

export default class Email {
  static allowedDomains = isProduction
    ? [process.env.TRADER_DOMAIN]
    : ["tony-masek.com", process.env.TRADER_DOMAIN];

  constructor(data = {}) {
    try {
      this.#validate(data);
      this.id = data.id;
      this.html = data.html;
      this.text = data.text;
      this.from = data.from;
      this.subject = decode(data.subject);
      this.timestamp = Date.now();
      this.emailHash = data.emailHash;
    } catch (error) {
      logger.error("Email validation failed:\n", error);
      throw error;
    }
  }

  getAllData() {
    return `
    ID: ${this.id}
    HTML: ${this.html}
    Text: ${this.text}
    From: ${this.from}
    To: ${this.to}
    Subject: ${this.subject}
    Timestamp: ${this.timestamp}
    Email hash: ${this.emailHash}
    `;
  }

  #validate(data) {
    this.#validateId(data);
    this.#validateAddressFrom(data);
    this.#validateEmailHtml(data);
    this.#validateText(data);
    this.#validateSubject(data);
    this.#validateHash(data);
  }

  #validateId(data) {
    if (!data.id || typeof data.id !== "string" || data.id.length < 1) {
      throw new Error("ID must be a non-empty string!");
    }
  }

  #validateAddressFrom(data) {
    const email = data.from[0]?.address;
    const domain = email ? email.split("@")[1] : "";

    if (!data.from || typeof data.from !== "object") {
      throw new Error("From field must be an object!");
    }

    if (!Array.isArray(data.from) || data.from.length === 0) {
      throw new Error("From must be a non-empty array!");
    }

    if (!email || typeof email !== "string") {
      throw new Error("From address must be a string!");
    }

    if (!Email.allowedDomains.includes(domain)) {
      throw new Error("Needs to come from the allowed sender!");
    }
  }

  #validateEmailHtml(data) {
    if (!data.html || typeof data.html !== "string" || data.html.length === 0) {
      throw new Error("Html cannot be empty!!");
    }
  }

  #validateText(data) {
    if (!data.text || typeof data.text !== "string") {
      throw new Error("Text must be a string!");
    }
  }

  #validateSubject(data) {
    if (
      !data.subject ||
      typeof data.subject !== "string" ||
      data.subject.length === 0
    ) {
      throw new Error("Subject cannot be empty and must be a string!");
    }
  }

  #validateHash(data) {
    if (!data.emailHash || typeof data.emailHash !== "string") {
      throw new Error("Hash must be a string!");
    }

    // Assuming SHA-256 hash (64 characters)
    if (!/^[a-f0-9]{64}$/i.test(data.emailHash)) {
      throw new Error("Invalid hash format!");
    }
  }

  getSubject() {
    return this.subject;
  }

  getHtml() {
    return this.html;
  }
}
