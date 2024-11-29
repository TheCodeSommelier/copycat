import { ImapClient } from "./infrastructure/email/index.js";
import { SpotClient, FuturesClient } from "./infrastructure/trading/index.js";

const main = async () => {
  const imapClient = new ImapClient();
  await imapClient.connect();

  imapClient.on("newEmail", (secureEmail) => {
    console.log("📩 New email is here!");
    console.log(secureEmail);
  });

  const spotClient = new SpotClient("BTC", "USDC", "SPOT", "SELL", "LIMIT");
  await spotClient.createTestSpotOrder();
};

main();
