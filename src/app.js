import { ImapClient } from "./infrastructure/email/index.js";


const main = async () => {
  const imapClient = new ImapClient();
  await imapClient.connect();
};

main();
