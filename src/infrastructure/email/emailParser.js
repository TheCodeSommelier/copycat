import validator from "validator";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import { z } from "zod"; // For runtime type validation

// Type definitions for better type safety and documentation
const EmailSchema = z.object({
  from: z
    .object({
      value: z.array(
        z.object({
          address: z.string().email(),
          name: z.string().optional(),
        })
      ),
    })
    .nullable(),
  to: z
    .object({
      value: z.array(
        z.object({
          address: z.string().email(),
          name: z.string().optional(),
        })
      ),
    })
    .nullable(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
});

export default class SecureEmailParser {
  #config;
  #sanitizeOptions;

  constructor(config = {}) {
    // Validate configuration
    this.#config = {
      allowedDomains: new Set(config.allowedDomains || []),
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB default
    };

    // HTML sanitization options
    this.#sanitizeOptions = {
      allowedTags: ["b", "i", "em", "strong", "p", "br", "h1", "h2", "h3"],
      allowedAttributes: {},
      disallowedTagsMode: "discard",
      allowProtocolRelative: false,
      parser: {
        lowerCaseTags: true,
        lowerCaseAttributeNames: true,
        decodeEntities: true,
      },
    };
  }

  /**
   * Parse and secure email data
   * @param {Object} emailData - Raw email data
   * @returns {Promise<Object>} Sanitized email data
   * @throws {Error} If validation or parsing fails
   */
  async parse(emailData) {
    try {
      // Validate input structure
      const validatedData = await EmailSchema.parseAsync(emailData);

      // Check size limits
      this.#checkSize(validatedData);

      // Create secured email object
      const secureEmail = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        from: this.#secureAddress(validatedData.from),
        to: this.#secureAddress(validatedData.to),
        subject: this.#secureText(validatedData.subject),
        text: this.#secureText(validatedData.text),
        html: this.#secureHtml(validatedData.html),
      };

      // Final security verification
      this.#verifySecurityConstraints(secureEmail);

      // Add integrity hash
      secureEmail.contentHash = this.#generateHash(secureEmail);

      return secureEmail;
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

  /**
   * Secure email addresses and validate domains
   * @private
   */
  #secureAddress(addressData) {
    if (!addressData?.value) return null;

    return addressData.value
      .filter((addr) => {
        if (!validator.isEmail(addr.address)) return false;

        // Domain validation if configured
        if (this.#config.allowedDomains.size > 0) {
          const domain = addr.address.split("@")[1].toLowerCase();
          return this.#config.allowedDomains.has(domain);
        }
        return true;
      })
      .map((addr) => ({
        address: validator.normalizeEmail(addr.address),
        name: addr.name ? this.#secureText(addr.name) : null,
      }));
  }

  /**
   * Secure text content
   * @private
   */
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

  /**
   * Secure HTML content
   * @private
   */
  #secureHtml(html) {
    if (!html) return null;

    // First pass: sanitize HTML
    let secured = sanitizeHtml(html, this.#sanitizeOptions);

    // Second pass: additional security measures
    secured = secured
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "[REMOVED]SCR")
      .replace(/(javascript:|data:|vbscript:)/gi, "[REMOVED]")
      .replace(/on\w+=/gi, "[REMOVED]")
      .replace(/&lt;script&gt;[\s\S]*?&lt;\/script&gt;/gi, "[REMOVED]");

    return secured;
  }

  /**
   * Check content size limits
   * @private
   */
  #checkSize(data) {
    const totalSize =
      Buffer.byteLength(data.text || "") +
      Buffer.byteLength(data.html || "") +
      Buffer.byteLength(data.subject || "");

    if (totalSize > this.#config.maxSize) {
      throw new Error("Content size exceeds limit");
    }
  }

  /**
   * Generate content integrity hash
   * @private
   */
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

  /**
   * Final security verification
   * @private
   */
  #verifySecurityConstraints(email) {
    const contentString = JSON.stringify(email);

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /on\w+=/i,
      /<iframe/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(contentString)) {
        throw new Error("Security constraints violation");
      }
    }
  }
}
