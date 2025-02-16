import crypto from "crypto";
import querystring from "querystring";
import dotenv from "dotenv";
dotenv.config();

function getKrakenSignature(urlPath, data, secret) {
  let encoded;
  if (typeof data === "string") {
    const jsonData = JSON.parse(data);
    encoded = jsonData.nonce + data;
  } else if (typeof data === "object") {
    const dataStr = querystring.stringify(data);
    encoded = data.nonce + dataStr;
  } else {
    throw new Error("Invalid data type");
  }

  const sha256Hash = crypto.createHash("sha256").update(encoded).digest();
  const message = urlPath + sha256Hash.toString("binary");
  const secretBuffer = Buffer.from(secret, "base64");
  const hmac = crypto.createHmac("sha512", secretBuffer);
  hmac.update(message, "binary");
  const signature = hmac.digest("base64");
  return signature;
}

const apiSec = process.env.KRAKEN_API_SECRET_TEST;

const payload = {
  nonce: "1739544514221",
};

const signature = getKrakenSignature("/0/private/Balance", payload, apiSec);
console.log(`API-Sign: ${signature}`);
console.log(
  `VALID SIGN: ${
    "OmdrNaBwGjtmINEGMnCp+AJKirS/NXUbVSDA6cw5N1IT0gQBtjjOSAcWwaF/KYQeWtfaiTM+F08J8whSK/kIOg==" === signature
  }`
);
