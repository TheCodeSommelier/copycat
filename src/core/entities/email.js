import { decode } from "html-entities";
import dotenv from "dotenv";
dotenv.config();

export default class Email {
  static allowedDomains = ["tony-masek.com", process.env.TRADER_DOMAIN];

  constructor({ id, html, text, from, to, subject, timestamp, emailHash }) {
    this.id = id;
    this.html = html;
    this.text = text;
    this.from = from;
    this.to = to;
    this.subject = decode(subject);
    this.timestamp = timestamp;
    this.emailHash = emailHash;
  }

  validate() {
    const result = [];
    const messages = [];

    // console.log("Id => ", this.id);
    // console.log("html => ", this.html);
    // console.log("text => ", this.text);
    // console.log("from => ", this.from);
    // console.log("to => ", this.to);
    // console.log("subject => ", this.subject);
    // console.log("timestamp => ", this.timestamp);
    // console.log("emailHash => ", this.emailHash);


    this.#validateId(result, messages);
    this.#validateAddressFrom(result, messages);
    this.#validateAddressTo(result, messages);
    this.#validateEmailHtml(result, messages);
    this.#validateText(result, messages);
    this.#validateSubject(result, messages);
    this.#validateTimestamp(result, messages);
    this.#validateHash(result, messages);

    return { result, messages };
  }

  #validateId(result, messages) {
    if (!this.id || typeof this.id !== "string" || this.id.length < 1) {
      messages.push("ID must be a non-empty string!");
      result.push(false);
      return;
    }
    result.push(true);
  }

  #validateAddressFrom(result, messages) {
    const email = this.from[0]?.address;

    const domain = email ? email.split("@")[1] : "";

    if (!this.from || typeof this.from !== "object") {
      messages.push("From field must be an object!");
      result.push(false);
      return;
    }

    if (!Array.isArray(this.from) || this.from.length === 0) {
      messages.push("From must be a non-empty array!");
      result.push(false);
      return;
    }

    if (!email || typeof email !== "string") {
      messages.push("From address must be a string!");
      result.push(false);
      return;
    }

    if (!Email.allowedDomains.includes(domain)) {
      messages.push("Needs to come from the allowed sender!");
      result.push(false);
      return;
    }

    result.push(true);
  }

  #validateAddressTo(result, messages) {
    if (!this.to || typeof this.to !== "object") {
      messages.push("To field must be an object!");
      result.push(false);
      return;
    }

    if (!Array.isArray(this.to) || this.to.length === 0) {
      messages.push("To must be a non-empty array!");
      result.push(false);
      return;
    }

    const email = this.from[0]?.address;

    if (!email || typeof email !== "string") {
      messages.push("To address must be a string!");
      result.push(false);
      return;
    }

    result.push(true);
  }

  #validateEmailHtml(result, messages) {
    if (!this.html || typeof this.html !== "string" || this.html.length === 0) {
      messages.push("Html cannot be empty!!");
      result.push(false);
      return;
    }
    result.push(true);
  }

  #validateText(result, messages) {
    if (!this.text || typeof this.text !== "string") {
      messages.push("Text must be a string!");
      result.push(false);
      return;
    }
    result.push(true);
  }

  #validateSubject(result, messages) {
    if (
      !this.subject ||
      typeof this.subject !== "string" ||
      this.subject.length === 0
    ) {
      messages.push("Subject cannot be empty!");
      result.push(false);
      return;
    }
    result.push(true);
  }

  #validateTimestamp(result, messages) {
    if (
      !this.timestamp ||
      typeof this.timestamp !== "number" ||
      isNaN(this.timestamp)
    ) {
      messages.push("Timestamp must be a valid number!");
      result.push(false);
      return;
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    if (this.timestamp < oneHourAgo || this.timestamp > now) {
      messages.push("Timestamp must be within the last hour!");
      result.push(false);
      return;
    }

    result.push(true);
  }

  #validateHash(result, messages) {
    if (!this.emailHash || typeof this.emailHash !== "string") {
      messages.push("Hash must be a string!");
      result.push(false);
      return;
    }

    // Assuming SHA-256 hash (64 characters)
    if (!/^[a-f0-9]{64}$/i.test(this.emailHash)) {
      messages.push("Invalid hash format!");
      result.push(false);
      return;
    }

    result.push(true);
  }

  static fromEmailData(emailData) {
    return new Email({
      id: emailData.id,
      html: emailData.html,
      text: emailData.text,
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      timestamp: Date.now(),
      emailHash: emailData.emailHash,
    });
  }

  getSubject() {
    return this.subject;
  }

  getHtml() {
    return this.html;
  }
}
