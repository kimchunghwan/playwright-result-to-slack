export const FINVIZ_SYMBOLS = ["TSLA", "PLTR", "QQQ", "SOXX", "SCHD", "IVV", "TLT", "GOOGL"];
export const GROWTH_SYMBOLS = ["TSLA", "PLTR", "QQQ", "SOXX", "RXRX"];
export const finvizURL = (symbol: string) => {
  if (GROWTH_SYMBOLS.includes(symbol)) {
    return `https://finviz.com/quote.ashx?t=${symbol}&p=d`;
  }
  return `https://finviz.com/quote.ashx?t=${symbol}&p=w`;
};
