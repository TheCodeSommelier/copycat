import { expect } from "../../../setup.js";
import EmailValidator from "../../../../infrastructure/email/emailValidator.js";

describe("EmailValidator", () => {
  describe("validateEmail()", () => {
    let validEmailData;

    beforeEach(() => {
      process.env.TRADER_DOMAIN = "verifiedinvesting.com";

      validEmailData = {
        html: "<p>Valid HTML content</p>",
        from: {
          value: [
            {
              address: "signals@verifiedinvesting.com",
              name: "Trading Signals",
            },
          ],
        },
      };
    });

    describe("Address Validation", () => {
      it("should accept email from allowed domain (verifiedinvesting.com)", () => {
        const result = EmailValidator.validateEmail(validEmailData);
        expect(result.result).to.include(true);
        expect(result.messages).to.be.empty;
      });

      it("should accept email from tony-masek.com domain", () => {
        const emailData = {
          ...validEmailData,
          from: {
            value: [
              {
                address: "trader@tony-masek.com",
                name: "Trader",
              },
            ],
          },
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(true);
        expect(result.messages).to.be.empty;
      });

      it("should reject email from unauthorized domain", () => {
        const emailData = {
          ...validEmailData,
          from: {
            value: [
              {
                address: "someone@unauthorized.com",
                name: "Unauthorized",
              },
            ],
          },
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include(
          "Needs to come from the allowed sender!"
        );
      });

      it("should handle malformed from address", () => {
        const emailData = {
          ...validEmailData,
          from: {
            value: [
              {
                address: "malformedaddress",
                name: "Malformed",
              },
            ],
          },
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include(
          "Needs to come from the allowed sender!"
        );
      });

      it("should reject when address field is missing in from value", () => {
        const emailData = {
          ...validEmailData,
          from: {
            value: [{
              name: "Missing Address"
              // address field missing
            }]
          }
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include("Needs to come from the allowed sender!");
      });
    });

    describe("HTML Validation", () => {
      it("should accept valid HTML content", () => {
        const result = EmailValidator.validateEmail(validEmailData);
        expect(result.result).to.include(true);
        expect(result.messages).to.be.empty;
      });

      it("should reject empty HTML", () => {
        const emailData = {
          ...validEmailData,
          html: "",
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include("Html cannot be empty!!");
      });

      it("should reject null HTML", () => {
        const emailData = {
          ...validEmailData,
          html: null,
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include("Html cannot be empty!!");
      });

      it("should reject non-string HTML content", () => {
        const emailData = {
          ...validEmailData,
          html: { content: "<p>Invalid</p>" }, // object instead of string
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include("Html cannot be empty!!");
      });
    });

    describe("Edge Cases", () => {
      it("should handle undefined email data", () => {
        expect(() => EmailValidator.validateEmail(undefined)).to.throw();
      });

      it("should handle missing from field", () => {
        const { from, ...emailDataWithoutFrom } = validEmailData;
        expect(() =>
          EmailValidator.validateEmail(emailDataWithoutFrom)
        ).to.throw();
      });

      it("should handle missing html field", () => {
        const { html, ...emailDataWithoutHtml } = validEmailData;
        const result = EmailValidator.validateEmail(emailDataWithoutHtml);
        expect(result.result).to.include(false);
        expect(result.messages).to.include("Html cannot be empty!!");
      });

      it("should handle empty value array in from field", () => {
        const emailData = {
          ...validEmailData,
          from: { value: [] },
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.result).to.include(false);
        expect(result.messages).to.include("Needs to come from the allowed sender!");
      });
    });

    describe("Multiple Validations", () => {
      it("should return all validation results", () => {
        const result = EmailValidator.validateEmail(validEmailData);
        expect(result.result).to.have.lengthOf(2); // Should have results for both validations
      });

      it("should collect all validation messages", () => {
        const emailData = {
          html: "",
          from: {
            value: [
              {
                address: "bad@unauthorized.com",
                name: "Bad",
              },
            ],
          },
        };
        const result = EmailValidator.validateEmail(emailData);
        expect(result.messages).to.have.lengthOf(2);
        expect(result.result).to.deep.equal([false, false]);
      });
    });
  });
});
