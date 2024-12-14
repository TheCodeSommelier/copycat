import EmailValidator from "./emailValidator.js";
import crypto from "crypto";
import validator from "validator";
import sanitizeHtml from "sanitize-html";

export default class SecureEmailParser {
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
    // console.log(`\nUnsanitized email html data => ${emailData.html}\n\n`);
    try {
      const validationResult = EmailValidator.validateEmail(emailData);
      const validatedEmail = {};

      if (!validationResult.includes(false)) {
        validatedEmail.id = crypto.randomUUID();
        validatedEmail.timestamp = Date.now();
        validatedEmail.html = this.#secureHtml(emailData.html?.trim());
        validatedEmail.text = this.#secureText(emailData.text?.trim());
        validatedEmail.to = this.#secureAddress(emailData.to);
        validatedEmail.from = this.#secureAddress(emailData.from);
        validatedEmail.subject = this.#secureText(emailData.subject);
      } else {
        throw new Error("Validation failed");
      }

      // console.log(`\nSanitized email html data => ${validatedEmail.html}\n\n`);

      validatedEmail.emailHash = this.#generateHash(validatedEmail);

      return validatedEmail;
    } catch (error) {
      // Log error securely (avoid exposing sensitive data)
      console.error("Email parsing error:", {
        errorType: error.constructor.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      });

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
