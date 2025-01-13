import Email from "../../core/entities/email.js";
import crypto from "crypto";
import validator from "validator";
import sanitizeHtml from "sanitize-html";
import logger from "../logger/logger.js";

export default class EmailParser {
  sanitizeOptions = {
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "ol",
      "ul",
      "li",
      "span",
    ],
    selfClosing: ["br"],
    nonBooleanAttributes: [],
    allowedAttributes: {
      "*": ["class", "id"],
    },
    allowedSchemes: [],
    allowedSchemesAppliedToAttributes: [],
    allowedSchemesByTag: {},
    allowedIframeHostnames: [],
    disallowedTagsMode: "discard",
    allowProtocolRelative: false,
    parser: {
      lowerCaseTags: true,
    },
  };

  /**
   * Parse and secure email data
   * @param {Object} emailData - Raw email data
   * @returns {Promise<Object>} Sanitized email data
   * @throws {Error} If validation or parsing fails
   */
  async parse(emailData) {
    try {
      const sanitizedEmail = {
        id: crypto.randomUUID(),
        html: this.#secureHtml(emailData.html?.trim()),
        text: this.#secureText(emailData.text?.trim()),
        to: this.#secureAddress(emailData.to),
        from: this.#secureAddress(emailData.from),
        subject: this.#secureText(emailData.subject),
        emailHash: this.#generateHash(emailData),
      };
      const email = new Email(sanitizedEmail);
      logger.info(`This is the email that came:\n${email.getAllData()}\n`);
      return email;
    } catch (error) {
      logger.error(`Email parsing error:\n`, error);
      throw new Error("Failed to parse email securely");
    }
  }

  // Private functions

  #generateHash(email) {
    const content = JSON.stringify({
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      timestamp: email.timestamp,
    });

    return crypto.createHash("sha256").update(content).digest("hex");
  }

  #secureAddress(addressData) {
    if (!addressData?.value) return null;

    if (addressData)
      return addressData.value
        .filter((addr) => {
          if (!validator.isEmail(addr.address)) return false;
          return true;
        })
        .map((addr) => ({
          address: validator.normalizeEmail(addr.address),
          name: addr.name ? this.#secureText(addr.name) : null,
        }));
  }

  #secureText(text) {
    if (!text) return null;

    return validator.escape(
      text
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
        .replace(/&gt;/g, "")
        .trim()
    );
  }

  #secureHtml(html) {
    if (!html) return null;

    let secured = sanitizeHtml(html, this.sanitizeOptions);

    secured = secured
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "[REMOVED]")
      .replace(
        /(javascript:|data:|vbscript:|<iframe:|<\/frame:)/gi,
        "[REMOVED]"
      )
      .replace(/on\w+=/gi, "[REMOVED]")
      .replace(/&lt;script&gt;[\s\S]*?&lt;\/script&gt;/i, "[REMOVED]");

    return secured;
  }
}
