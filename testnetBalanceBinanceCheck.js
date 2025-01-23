import {
  binanceConfigTestSpot,
  binanceConfigTestFutures,
} from "./src/config/binance.js";
import {
  binanceApiCall,
  getDataToSend,
} from "./src/infrastructure/trading/binance/utils.js";

const MAJOR_COINS = ["BTC", "ETH", "AVAX", "ADA", "DOGE", "ICP", "TON"];

async function spotAssetAmount() {
  try {
    const data = {
      timestamp: Date.now(),
    };

    const { queryString, signature } = getDataToSend(
      data,
      binanceConfigTestSpot.api_secret
    );

    const result = await binanceApiCall(
      `https://testnet.binance.vision/api/v3/account?${queryString}&signature=${signature}`,
      "GET",
      {
        "X-MBX-APIKEY": binanceConfigTestSpot.api_key,
        "Content-Type": "application/json",
      }
    );

    console.log("Spot here is how they are doing:\n", result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function futuresAssetAmount() {
  try {
    const data = {
      timestamp: Date.now(),
    };

    const { queryString, signature } = getDataToSend(
      data,
      binanceConfigTestFutures.api_secret
    );

    const result = await binanceApiCall(
      `https://testnet.binancefuture.com/fapi/v2/balance?${queryString}&signature=${signature}`,
      "GET",
      {
        "X-MBX-APIKEY": binanceConfigTestFutures.api_key,
        "Content-Type": "application/json",
      }
    );

    console.log("Futures here is how they are doing:\n", result);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

const spotResult = await spotAssetAmount();
const futuresResult = await futuresAssetAmount();

const spotCoinsWithBalance = spotResult.balances.filter(
  (balance) => parseFloat(balance.free) > 0
);

const majorCoins = spotResult.balances.filter(
  (coin) => MAJOR_COINS.includes(coin.asset) && parseFloat(coin.free) > 0
);

const futuresCoinsWithBalance = futuresResult.filter(
  (coin) => parseFloat(coin.balance) > 0
);

console.log("Spot coins with balance:\n");
spotCoinsWithBalance.forEach((coin) => {
  console.log(`${coin.asset}: ${coin.free}`);
});

console.log("\n\nMajor coins spot:\n");
majorCoins.forEach((coin) => {
  console.log(`${coin.asset}: ${coin.free}`);
});

console.log("\n\nFutures coins with balance:\n");
futuresCoinsWithBalance.forEach((coin) => {
  console.log(`${coin.asset}: ${coin.balance}`);
});
