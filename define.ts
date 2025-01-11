const SYMBOLS = ["TSLA", "PLTR", "QQQ", "SOXX", "SCHD", "IVV", "TLT", "GOOGL"];
const GROWTH_SYMBOLS = ["TSLA", "PLTR", "QQQ", "SOXX", "RXRX", "NVDA"];
export const FINVIZ_SYMBOLS = new Set([...SYMBOLS, ...GROWTH_SYMBOLS]);

export const finvizURL = (symbol: string) => {
  if (GROWTH_SYMBOLS.includes(symbol)) {
    return `https://finviz.com/quote.ashx?t=${symbol}&p=d`;
  }
  return `https://finviz.com/quote.ashx?t=${symbol}&p=w`;
};
