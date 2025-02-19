export default class FilterApplicatorService {
  static calculateBuyVolume(balance, entryPrice, filters) {
    const { lotDecimals, lotMultiplier, ordermin } = filters;
    const stepSize = parseInt(lotDecimals);

    const quoteSize = parseFloat(balance) * 0.1;
    const volume = (quoteSize / parseFloat(entryPrice)) * parseInt(lotMultiplier);

    if (volume < parseFloat(ordermin)) {
      throw new Error("Insufficient balance for minimum order size");
    }

    return parseFloat(volume).toFixed(stepSize);
  }

  static calculateSellVolume(balance, filters, isHalf) {
    const { lotDecimals } = filters;
    const stepSize = parseInt(lotDecimals);
    const sellVolume = isHalf ? parseFloat(balance) / 2 : parseFloat(balance);

    return parseFloat(sellVolume).toFixed(stepSize);
  }
}
