// Simple currency conversion utility for USD to NPR
// You can update this with a real exchange rate API

const EXCHANGE_RATE = 130.5; // 1 USD = 130.5 NPR (approximate, update as needed)

export function convertUSDToNPR(amountUSD) {
    return parseFloat((amountUSD * EXCHANGE_RATE).toFixed(2));
}

export function convertNPRToUSD(amountNPR) {
    return parseFloat((amountNPR / EXCHANGE_RATE).toFixed(2));
}

export const EXCHANGE_RATES = {
    USD_TO_NPR: EXCHANGE_RATE,
    NPR_TO_USD: EXCHANGE_RATE
};
