import { expect } from "../../../setup.js";
import Email from "../../../../core/entities/email.js";

describe("Email Entity", () => {
  let validEmailData;

  beforeEach(() => {
    process.env.TRADER_DOMAIN = "verifiedinvesting.com";

    validEmailData = {
      id: "test-uuid",
      html: "<p>Valid HTML content</p>",
      text: "Valid text content",
      from: [
        {
          address: "signals@verifiedinvesting.com",
          name: "Trading Signals",
        },
      ],
      to: [
        {
          address: "trader@tony-masek.com",
          name: "Trader",
        },
      ],
      subject: "Buy Alert: BTC/USD",
      timestamp: Date.now(),
      emailHash: "a".repeat(64), // Valid SHA-256 hash format
    };
  });

  describe("Constructor", () => {
    it("should create a valid email instance", () => {
      const email = new Email(validEmailData);
      expect(email).to.be.instanceOf(Email);
      expect(email.id).to.equal(validEmailData.id);
      expect(email.html).to.equal(validEmailData.html);
    });

    it("should decode HTML entities in subject", () => {
      const emailData = {
        ...validEmailData,
        subject: "Buy Alert: BTC&#x2F;USD",
      };
      const email = new Email(emailData);
      expect(email.subject).to.equal("Buy Alert: BTC/USD");
    });
  });

  describe("Validation", () => {
    describe("ID Validation", () => {
      it("should accept valid ID", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("ID must be a non-empty string!");
      });

      it("should reject empty ID", () => {
        const email = new Email({ ...validEmailData, id: "" });
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("ID must be a non-empty string!");
      });

      it("should reject non-string ID", () => {
        const email = new Email({ ...validEmailData, id: 123 });
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("ID must be a non-empty string!");
      });
    });

    describe("From Address Validation", () => {
      it("should accept valid from address", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include(
          "Needs to come from the allowed sender!"
        );
      });

      it("should accept tony-masek.com domain", () => {
        const emailData = {
          ...validEmailData,
          from: [{ address: "test@tony-masek.com", name: "Test" }],
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include(
          "Needs to come from the allowed sender!"
        );
      });

      it("should reject unauthorized domain", () => {
        const emailData = {
          ...validEmailData,
          from: [{ address: "test@unauthorized.com", name: "Test" }],
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Needs to come from the allowed sender!");
      });

      it("should reject empty from array", () => {
        const emailData = {
          ...validEmailData,
          from: [],
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("From must be a non-empty array!");
      });
    });

    describe("To Address Validation", () => {
      it("should accept valid to address", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("To field must be an object!");
      });

      it("should reject empty to array", () => {
        const emailData = {
          ...validEmailData,
          to: [],
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("To must be a non-empty array!");
      });
    });

    describe("HTML Content Validation", () => {
      it("should accept valid HTML", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("Html cannot be empty!!");
      });

      it("should reject empty HTML", () => {
        const emailData = {
          ...validEmailData,
          html: "",
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Html cannot be empty!!");
      });

      it("should reject non-string HTML", () => {
        const emailData = {
          ...validEmailData,
          html: { content: "<p>test</p>" },
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Html cannot be empty!!");
      });
    });

    describe("Text Content Validation", () => {
      it("should accept valid text", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("Text must be a string!");
      });

      it("should reject non-string text", () => {
        const emailData = {
          ...validEmailData,
          text: 123,
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Text must be a string!");
      });
    });

    describe("Subject Validation", () => {
      it("should accept valid subject", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("Subject cannot be empty!");
      });

      it("should reject empty subject", () => {
        const emailData = {
          ...validEmailData,
          subject: "",
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Subject cannot be empty!");
      });
    });

    describe("Timestamp Validation", () => {
      it("should accept current timestamp", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("Timestamp must be a valid number!");
      });

      it("should reject old timestamp", () => {
        const emailData = {
          ...validEmailData,
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Timestamp must be within the last hour!");
      });

      it("should reject future timestamp", () => {
        const emailData = {
          ...validEmailData,
          timestamp: Date.now() + 60 * 60 * 1000, // 1 hour in future
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Timestamp must be within the last hour!");
      });
    });

    describe("Hash Validation", () => {
      it("should accept valid SHA-256 hash", () => {
        const email = new Email(validEmailData);
        const { result, messages } = email.validate();
        expect(result).to.include(true);
        expect(messages).to.not.include("Invalid hash format!");
      });

      it("should reject invalid hash format", () => {
        const emailData = {
          ...validEmailData,
          emailHash: "invalid-hash",
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Invalid hash format!");
      });

      it("should reject non-string hash", () => {
        const emailData = {
          ...validEmailData,
          emailHash: 123,
        };
        const email = new Email(emailData);
        const { result, messages } = email.validate();
        expect(result).to.include(false);
        expect(messages).to.include("Hash must be a string!");
      });
    });
  });

  describe("Static Methods", () => {
    describe("fromEmailData", () => {
      it("should create valid email instance from email data", () => {
        const email = Email.fromEmailData(validEmailData);
        expect(email).to.be.instanceOf(Email);
        const { result, messages } = email.validate();
        expect(result).to.not.include(false);
        expect(messages).to.be.empty;
      });
    });
  });

  describe("Getter Methods", () => {
    it("getSubject should return decoded subject", () => {
      const emailData = {
        ...validEmailData,
        subject: "Buy Alert: BTC&#x2F;USD",
      };
      const email = new Email(emailData);
      expect(email.getSubject()).to.equal("Buy Alert: BTC/USD");
    });

    it("getHtml should return HTML content", () => {
      const email = new Email(validEmailData);
      expect(email.getHtml()).to.equal(validEmailData.html);
    });
  });
});
