export default class FilterApplicatorService {
  static calculateBuyVolume(balance, entryPrice, filters) {
    const { lot_decimals, lot_multiplier, ordermin } = filters;
    const stepSize = parseInt(lot_decimals);

    console.log("Filters:", filters);

    const quoteSize = parseFloat(balance) * 0.03;
    console.log("Quote size:", quoteSize);

    const volume = (quoteSize / parseFloat(entryPrice)) * parseInt(lot_multiplier);
    console.log("volume:", volume);

    if (volume < parseFloat(ordermin)) {
      throw new Error("Insufficient balance for minimum order size");
    }

    return parseFloat(volume).toFixed(stepSize);
  }

  static calculateSellVolume(balance, filters, isHalf) {
    const { lot_decimals } = filters;
    const sellVolume = isHalf ? parseFloat(balance) / 2.0 : parseFloat(balance);
    return parseFloat(sellVolume).toFixed(lot_decimals);
  }

  static applyPriceFilters(priceFilters, data) {
    const prices = [data.entryPrice, data.stopLoss, data.takeProfit]; // [WARNING] DO NOT CHANGE THE ORDER OF THE PRICES HERE
    return prices.map((price) => {
      return parseFloat(price).toFixed(priceFilters.pair_decimals);
    });
  }
}
