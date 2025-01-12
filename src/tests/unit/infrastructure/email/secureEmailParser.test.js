import { expect } from "../../../setup.js";
import SecureEmailParser from "../../../../infrastructure/email/secureEmailParser.js";
import TradeDataExtractor from "../../../../services/TradeDataParser.js";
import crypto from "crypto";
import sinon from "sinon";
import { fixtures } from "../../../helpers/emailParserFixtures.js";
import logger from "../../../../services/logger.js";

describe("SecureEmailParser", () => {
  let parser;
  let clock;

  beforeEach(() => {
    parser = new SecureEmailParser();
    clock = sinon.useFakeTimers(new Date("2024-01-01").getTime());

    // Stub dependencies
    sinon.stub(TradeDataExtractor, "extractTradeData").returns({
      symbol: "BTCUSDT",
      side: "BUY",
    });
    sinon.stub(crypto, "randomUUID").returns("test-uuid");
    sinon.stub(logger, "info");
  });

  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  describe("parse()", () => {
    fixtures.forEach((fixture, index) => {
      describe(`Fixture ${index + 1}: ${fixture.subject}`, () => {
        it(`should process email with valid trade alert subject: "${fixture.subject}"`, async () => {
          const subject = fixture.subject.replace("&#x2F;", "/");
          const result = await parser.parse(fixture);

          expect(result).to.not.be.undefined;
          expect(result.id).to.equal("test-uuid");
          expect(result.subject).to.equal(subject);
        });

        it("should generate unique ID and timestamp", async () => {
          const parsedEmail = await parser.parse(fixture);
          expect(parsedEmail.id).to.equal("test-uuid");
          expect(parsedEmail.timestamp).to.equal(
            new Date("2024-01-01").getTime()
          );
          expect(crypto.randomUUID.calledOnce).to.be.true;
        });

        it("should include ID and timestamp in trade data", async () => {
          TradeDataExtractor.extractTradeData.returns({
            symbol: "BTCUSDT",
            side: "BUY",
            id: "test-uuid",
            timestamp: new Date("2024-01-01").getTime(),
          });

          const result = await parser.parse(fixture);
          expect(result.id).to.equal("test-uuid");
          expect(result.timestamp).to.equal(new Date("2024-01-01").getTime());
        });

        describe("HTML Sanitization", () => {
          beforeEach(() => {
            TradeDataExtractor.extractTradeData.callsFake((validatedEmail) => ({
              ...validatedEmail,
            }));
          });

          it("should sanitize HTML and remove dangerous content", async () => {
            const unsafeHtml = `
              <p>Safe content</p>
              <script>alert('xss')</script>
              <img src="x" onerror="alert('xss')">
              <a href="javascript:alert('xss')">Click me</a>
              <iframe src="evil.com"></iframe>
            `;

            const result = await parser.parse({
              ...fixture,
              html: unsafeHtml,
            });

            expect(result.html).to.not.include("<script>");
            expect(result.html).to.not.include("onerror=");
            expect(result.html).to.not.include("javascript:");
            expect(result.html).to.not.include("<iframe");
            expect(result.html).to.include("<p>Safe content</p>");
          });

          it("should only allow specified HTML tags", async () => {
            const mixedHtml = `
              <p>Allowed paragraph</p>
              <div>Not allowed div</div>
              <b>Allowed bold</b>
              <script>Not allowed script</script>
              <span>Allowed span</span>
              <iframe>Not allowed iframe</iframe>
            `;

            const result = await parser.parse({
              ...fixture,
              html: mixedHtml,
            });

            expect(result.html).to.include("<p>");
            expect(result.html).to.include("<b>");
            expect(result.html).to.include("<span>");
            expect(result.html).to.not.include("<div>");
            expect(result.html).to.not.include("<script>");
            expect(result.html).to.not.include("<iframe>");
          });

          it("should handle HTML entities correctly", async () => {
            const htmlWithEntities = `
              <p>&lt;script&gt;alert('xss')&lt;/script&gt;</p>
              <p>Text with &amp; and &quot;quotes&quot;</p>
            `;

            const result = await parser.parse({
              ...fixture,
              html: htmlWithEntities,
            });

            expect(result.html).to.not.include("alert");
            expect(result.html).to.include("&amp;");
          });

          it("should remove all event handlers", async () => {
            const htmlWithEvents = `
              <p onclick="alert('click')">Click me</p>
              <button onmouseover="alert('hover')">Hover me</button>
              <div onload="alert('load')">Load</div>
            `;

            const result = await parser.parse({
              ...fixture,
              html: htmlWithEvents,
            });

            expect(result.html).to.not.include("onclick");
            expect(result.html).to.not.include("onmouseover");
            expect(result.html).to.not.include("onload");
          });
        });

        describe("Text Security", () => {
          it("should escape special characters and remove HTML", async () => {
            const text = "<p>Test & demo < > \" ' text</p>";
            const result = await parser.parse({
              ...fixture,
              text,
            });
            expect(result.text).to.not.include("<p>");
            expect(result.text).to.include("&amp;");
            expect(result.text).to.include("&quot;");
          });

          it("should remove control characters", async () => {
            const text = "Test\x00\x1F\x7Ftext";
            const result = await parser.parse({
              ...fixture,
              text,
            });

            expect(result.text).to.equal("Testtext");
          });
        });

        describe("Hash Generation", () => {
          it("should generate consistent hash for same content", async () => {
            const result1 = await parser.parse(fixture);
            const result2 = await parser.parse(fixture);
            expect(result1.emailHash).to.equal(result2.emailHash);
          });

          it("should generate different hashes for different content", async () => {
            const result1 = await parser.parse(fixture);
            const result2 = await parser.parse({
              ...fixture,
              subject: "Buy Alert: SAY/USD",
            });

            expect(result1.emailHash).to.not.equal(result2.emailHash);
          });
        });
      });
    });
  });

  describe("Email format variations", () => {
    it("should normalize email addresses", async () => {
      const modifiedFixture = {
        ...fixtures[0],
        from: {
          value: [
            {
              address: "TEST@toNy-mAsek.Com",
              name: "Test User",
            },
          ],
        },
      };
      const result = await parser.parse(modifiedFixture);
      expect(result.from[0].address).to.equal("test@tony-masek.com");
    });
  });
});
