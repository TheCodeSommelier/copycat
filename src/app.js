import { ImapClient } from "./infrastructure/email/index.js";
import TradeDataExtractor from "./infrastructure/email/tradeDataParser.js";
import { SpotClient, FuturesClient } from "./infrastructure/trading/index.js";

const main = async () => {
  const imapClient = new ImapClient();
  await imapClient.connect();

  imapClient.on("newEmail", (secureEmail) => {
    console.log("📩 New email is here!");
    console.log(secureEmail);
  });

  const testHtmlString1 =
    '<br id="lineBreakAtBeginningOfMessage" /><br />Begin forwarded message:<br class="Apple-interchange-newline" /><span><b>From: </b></span><span>Verified Investing &lt;support@verifiedinvesting.com&gt;<br /></span><span><b>Subject: </b></span><span><b>Buy Alert: TON/USD</b><br /></span><span><b>Date: </b></span><span>4 December 2024 at 1:06:00 CET<br /></span><span><b>To: </b></span><span>trader@tony-masek.com<br /></span><span><b>Reply-To: </b></span><span>Verified Investing &lt;support@verifiedinvesting.com&gt;<br /></span><br /><h2 class="post-heading">Buy Alert: TON/USD</h2><p class="post-author-name">Gareth Soloway</p>Posted in Smart Money - Crypto Buy TON/USD  Entry: $6.77 (Approx 1.5% of Portfolio)  Stop: Confirmation Below $5.00  Target: $10.00  TRX/USD just popped 100%. Market cap wise it is the same as TRX just before the pop. Worth a sh... <p>Read more</p> Change notification settings<span class="Apple-converted-space"> </span>  <span class="Apple-converted-space"> </span>Unsubscribe from all emails<span class="Apple-converted-space"> </span><span></span><br />';

  const testHtmlString2 = `'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'  \n' +
'  \n' +
'\n' +
'\n' +
'  \n' +
'    \n' +
'      \n' +
'        \n' +
'\n' +
'          \n' +
'          \n' +
'            \n' +
'              \n' +
'                \n' +
'                  \n' +
'                    \n' +
'                      \n' +
'                        \n' +
'                          \n' +
'                            \n' +
'                              \n' +
'                                  \n' +
'
<h2 class="post-heading">Short Alert: ETH/USD (Add)</h2>
\n' +
'                                    \n' +
'                                      \n' +
'                                        \n' +
'                                          \n' +
'                                            \n' +
'                                                \n' +
'                                            \n' +
'                                          \n' +
'                                          \n' +
'
<p class="post-author-name">Gareth Soloway</p>
\n' +
'
<p class="post-author-space">\n' +
   '                                              Posted in Smart Money - Crypto\n' +
   '
</p>
\n' +
'                                          \n' +
'                                        \n' +
'                                      \n' +
'                                    \n' +
'                                  \n' +
'\n' +
'                                \n' +
'                                  \n' +
'                                    \n' +
'                                      \n' +
'                                    \n' +
'                                  \n' +
'\n' +
'                              \n' +
'                            \n' +
'                          \n' +
'\n' +
'                        \n' +
'                      \n' +
'                    \n' +
'\n' +
'                  \n' +
'                \n' +
'              \n' +
'\n' +
'            \n' +
'          \n' +
'\n' +
'\n' +
'          \n' +
'            \n' +
'              \n' +
'                \n' +
'                  \n' +
'\n' +
'\n' +
'\n' +
'\n' +
'  \n' +
'  \n' +
'  \n' +
'    \n' +
'    \n' +
'      \n' +
'        \n' +
'          \n' +
'          \n' +
'            \n' +
'              \n' +
'                \n' +
'                \n' +
'                \n' +
'                  \n' +
'                    \n' +
'                        \n' +
'                            \n' +
'                              Short ETH/USD\n' +
'\n' +
'Entry: $3,852 (Approx 5% of Portfolio)\n' +
'\n' +
'Average: $3,506 (Approx 10% of Portfolio)\n' +
'\n' +
'Stop: Confirmation Above $5,000\n' +
'\n' +
'Target: $2,000\n' +
'                            \n' +
'                        \n' +
'
<p>\n' +
   '                          Read more\n' +
   '
</p>
\n' +
'                    \n' +
'                  \n' +
'                \n' +
'\n' +
'                \n' +
'              \n' +
'            \n' +
'          \n' +
'\n' +
'        \n' +
'      \n' +
'    \n' +
'\n' +
'  \n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'  \n' +
'  \n' +
'            \n' +
'              \n' +
'                \n' +
'  \n' +
'     \n' +
'  \n' +
'  \n' +
'    \n' +
'      Change notification settings\n' +
'        \n' +
'      Unsubscribe from all emails\n' +
'    \n' +
'  \n' +
'\n' +
'\n' +
'  \n' +
'    \n' +
'      \n' +
'        \n' +
'      \n' +
'      \n' +
'        \n' +
'      \n' +
'    \n' +
'  \n' +
'\n' +
'\n' +
'\n' +
'\n' +
'              \n' +
'            \n' +
'\n' +
'        \n' +
'\n' +
'      \n' +
'    \n' +
'  \n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n' +
'\n'`;

  const validatedEmail = {
    subject: "Short Alert: ETH/USD (Add)",
    html: testHtmlString2,
  };
  const tradeData = TradeDataExtractor.extractTradeData(validatedEmail);
  console.log(tradeData);

  tradeData.clientType === "FUTURES" ? testFutures(tradeData) : testSpot(tradeData);
};

const testFutures = async (tradeData) => {
  const futuresClient = new FuturesClient();

  const tradeRes = await futuresClient.enqueueFuturesOrders(tradeData);
  console.log("TRADE_RES => ", tradeRes);
};

const testSpot = async (tradeData) => {
  const spotClient = new SpotClient();

  const tradeRes = await spotClient.executeTrade(tradeData);
  console.log("TRADE_RES => ", tradeRes);
};

main();
