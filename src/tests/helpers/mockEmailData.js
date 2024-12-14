/**
 * Test data for SecureEmailParser
 */

// Valid email test cases
const validEmails = {
  // Standard sell alert with performance data
  subject: "Sell Alert: TIA/USD",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; margin-bottom: 20px;">Sell Alert: TIA/USD</h2>

      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #444;">Trade Details</h3>
        <p style="margin: 5px 0;">TIA/USD</p>
        <p style="margin: 5px 0;">Entry: 11/21/2024 @ $5.33</p>
        <p style="margin: 5px 0;">Exit: 11/23/2024 @ $6.18</p>
        <p style="margin: 5px 0; color: #47d147;">Profit: +15.50%</p>
      </div>
    </div>
  `,
  text: `
Sell Alert: TIA/USD

Trade Details
TIA/USD
Entry: 11/21/2024 @ $5.33
Exit: 11/23/2024 @ $6.18
Profit: +15.50%
  `,
  from: {
    value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
  },
  to: {
    value: [{ address: "trader@example.com", name: "Trader" }],
  },

  // Standard buy signal
  buySignal: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <h2 class="post-heading">Buy Alert: BTC/USD</h2>
      <p class="post-author-name">Trading Signal</p>
      Posted in Premium Service
      Buy BTC/USD
      Entry: $42,500 (Approx 2% of Portfolio)
      Stop: Confirmation Below $40,000
      Target: $45,000
      <p>Read more</p>
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // Short signal with multiple entries
  shortSignal: {
    subject: "Short Alert: ETH/USD (Add)",
    html: `
      <h2 class="post-heading">Short Alert: ETH/USD (Add)</h2>
      <p class="post-author-name">Trading Signal</p>
      Posted in Premium Service
      Short ETH/USD
      Entry: $3,852 (Approx 5% of Portfolio)
      Average: $3,506 (Approx 10% of Portfolio)
      Stop: Confirmation Above $5,000
      Target: $2,000
      <p>Read more</p>
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // Forward chain example
  forwardedSignal: {
    subject: "Fwd: Buy Alert: TON/USD",
    html: `
      <br id="lineBreakAtBeginningOfMessage" />
      Begin forwarded message:<br />
      <span><b>From: </b></span>
      <span>Verified Trading &lt;support@verifiedtrading.com&gt;<br /></span>
      <h2 class="post-heading">Buy Alert: TON/USD</h2>
      Buy TON/USD
      Entry: $6.77 (Approx 1.5% of Portfolio)
      Stop: Confirmation Below $5.00
      Target: $10.00
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // SendGrid-style marketing email
  marketingEmail: {
    subject: "Weekly Trading Digest: New BTC/USD Signal",
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width">
          <title>Trading Signal Alert</title>
        </head>
        <body style="margin: 0; padding: 0; min-width: 100%; background-color: #ffffff;">
          <center class="wrapper" style="width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
            <div class="webkit" style="max-width: 600px;">
              <!--[if (gte mso 9)|(IE)]>
              <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
              <![endif]-->
              <table class="outer" align="center" style="border-spacing: 0; font-family: sans-serif; color: #333333; margin: 0 auto; width: 100%; max-width: 600px;">
                <tr>
                  <td class="header" style="padding: 40px 30px 20px 30px;">
                    <table width="100%" style="border-spacing: 0;">
                      <tr>
                        <td style="padding: 0; text-align: center;">
                          <img src="https://trading.example.com/logo.png" alt="Trading Platform" style="border: 0;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="signal-content" style="padding: 20px 30px 40px 30px;">
                    <table width="100%" style="border-spacing: 0;">
                      <tr>
                        <td style="padding: 0;">
                          <h2 style="margin: 0 0 20px 0; font-size: 24px; line-height: 32px; color: #333333;">
                            BUY Alert: BTC/USD (Premium Signal)
                          </h2>
                          <div class="signal-details" style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                            Entry Zone: $42,500 - $43,000
                            <br>
                            Stop Loss: $41,000
                            <br>
                            Targets:
                            <br>
                            1. $45,000 (35%)
                            <br>
                            2. $47,000 (35%)
                            <br>
                            3. $50,000 (30%)
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="action-button" style="padding: 0 30px 40px 30px; text-align: center;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <table border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td align="center" style="border-radius: 5px;" bgcolor="#007bff">
                                <a href="https://trading.example.com/signal/1234?utm_source=email&utm_medium=signal&utm_campaign=btc_buy&ct=signal&mt=8&t=1234abc"
                                   target="_blank"
                                   style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #007bff; display: inline-block;">
                                   View Complete Analysis
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="footer" style="padding: 20px 30px; text-align: center; font-size: 12px; color: #666666;">
                    <p style="margin: 0;">
                      You received this email because you subscribed to Premium Trading Signals.
                      <a href="{{unsubscribe_url}}" style="color: #666666; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
              <!--[if (gte mso 9)|(IE)]>
                  </td>
                </tr>
              </table>
              <![endif]-->
            </div>
          </center>
        </body>
      </html>
    `,
    from: {
      value: [
        {
          address: "signals@trading.example.com",
          name: "Premium Trading Signals",
        },
      ],
    },
    to: {
      value: [
        {
          address: "trader@example.com",
          name: "John Trader",
        },
      ],
    },
    list: {
      unsubscribe: {
        url: "https://trading.example.com/unsubscribe?user=123&token=abc",
        comment: "Unsubscribe from trading signals",
      },
    },
  },
};

// Edge cases
const edgeCases = {
  // Missing price information
  missingPrice: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <h2 class="post-heading">Buy Alert: BTC/USD</h2>
      Buy BTC/USD
      Entry: Market Price
      Stop: Previous low
      Target: Open
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // Multiple symbols mentioned
  multipleSymbols: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <h2 class="post-heading">Buy Alert: BTC/USD</h2>
      While ETH/USD looks weak, Buy BTC/USD
      Entry: $42,500
      Stop: $40,000
      Target: $45,000
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // Empty content
  emptyContent: {
    subject: "Buy Alert: BTC/USD",
    html: "",
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // Malformed HTML
  malformedHtml: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <h2>Buy Alert: BTC/USD</h2
      <p>Buy BTC/USD</p
      Entry: $42,500
      <unclosed>Stop: $40,000
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },
};

// Malicious cases
const maliciousCases = {
  // XSS attempt
  xssAttempt: {
    subject: 'Buy Alert: BTC/USD<script>alert("xss")</script>',
    html: `
      <h2 class="post-heading">Buy Alert: BTC/USD</h2>
      <script>alert('xss')</script>
      <img src="x" onerror="alert('xss')">
      Entry: $42,500<script>document.location='http://evil.com'</script>
      Stop: $40,000
      Target: $45,000
      <iframe src="javascript:alert('xss')"></iframe>
    `,
    from: {
      value: [
        {
          address: 'signals@verifiedinvesting.com<script>alert("xss")</script>',
          name: 'Trading Signals<script>alert("xss")</script>',
        },
      ],
    },
    to: {
      value: [
        {
          address: "trader@example.com",
          name: 'Trader<img src=x onerror=alert("xss")>',
        },
      ],
    },
  },

  // SQL Injection attempt
  sqlInjectionAttempt: {
    subject: "Buy Alert: BTC/USD'; DROP TABLE trades;--",
    html: `
      <h2>Buy Alert: BTC/USD</h2>
      Entry: $42,500'; DELETE FROM trades WHERE 1=1;--
      Stop: $40,000'; TRUNCATE TABLE users;--
      Target: $45,000
    `,
    from: {
      value: [
        {
          address: "signals@verifiedinvesting.com'; DROP TABLE users;--",
          name: "Trading Signals'; DROP TABLE signals;--",
        },
      ],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // HTML encoding attack
  encodingAttack: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <h2>Buy Alert: BTC/USD</h2>
      Entry: $42,500
      Stop: $40,000
      Target: $45,000
      &#60;script&#62;alert('xss')&#60;/script&#62;
      &lt;script&gt;alert("xss")&lt;/script&gt;
      &#x3C;script&#x3E;alert("xss")&#x3C;/script&#x3E;
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "Trading Signals" }],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  // Control character injection
  controlCharacterAttack: {
    subject: "Buy Alert: BTC/USD\x00\x1F",
    html: `
      <h2>Buy Alert: BTC/USD\x00\x1F</h2>
      Entry: $42,500\x00\x1F
      Stop: $40,000\x00\x1F
      Target: $45,000\x00\x1F
    `,
    from: {
      value: [
        {
          address: "signals@verifiedinvesting.com\x00\x1F",
          name: "Trading Signals\x00\x1F",
        },
      ],
    },
    to: {
      value: [{ address: "trader@example.com", name: "Trader" }],
    },
  },

  templateInjection: {
    subject: "Buy Alert: {{evil.command}}",
    html: `
      <h2>Buy Alert: ${"{{"}.evil.command}}</h2>
      Entry: {{''.constructor.constructor("alert('xss')")()}}
      Stop: <%= File.delete('/etc/passwd') %>
      Target: {{request.evil.command}}
    `,
    from: {
      value: [{ address: "signals@verifiedinvesting.com", name: "{{evil.name}}" }],
    },
  },

  // Protocol pollution
  protocolPollution: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <a href="javascript:alert('xss')">Click here</a>
      <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgneHNzJyk8L3NjcmlwdD4=">View details</a>
      <a href="vbscript:alert('xss')">Learn more</a>
      <img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+"/>
    `,
  },

  // Event handler injection
  eventHandlerInjection: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <div onclick="alert('xss')">Click me</div>
      <button onmouseover="alert('xss')">Hover me</button>
      <img onload="alert('xss')" src="x"/>
      <body onload="alert('xss')">
    `,
  },

  // URL manipulation
  urlManipulation: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <a href="https://trading.example.com@evil.com">Trading Platform</a>
      <a href="https://evil.com/trading.example.com">Dashboard</a>
      <a href="////evil.com/trading">Account</a>
      <a href="https:javascript:alert('xss')">Settings</a>
    `,
  },

  // Meta character injection
  metaCharacterInjection: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <meta http-equiv="refresh" content="0; url=javascript:alert('xss')">
      <meta charset="utf-7">
      <meta http-equiv="Set-Cookie" content="session=steal">
    `,
  },

  // DOM clobbering attempt
  domClobbering: {
    subject: "Buy Alert: BTC/USD",
    html: `
      <form id="test"><input name="nodeType">
      <input id="root">
      <object id="location" name="location">
      <img id="length" name="length">
    `,
  },
};

export { validEmails, edgeCases, maliciousCases };
