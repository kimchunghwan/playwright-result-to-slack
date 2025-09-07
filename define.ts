// Constants
export const TEST_RESULT_PATH = "./test-results";
export const SLACK_CHANNEL_ID = "C032JKDP3TJ";
export const UTC_OFFSET_HOURS = 9;

// Stock symbols
const SYMBOLS = ["TSLA", "PLTR", "QQQ", "SOXX", "SCHD", "IVV", "TLT", "GOOGL", "CWEB", "QTUM"];
const GROWTH_SYMBOLS = ["TSLA", "PLTR", "QQQ", "SOXX", "RXRX", "NVDA", "CWEB"];
export const FINVIZ_SYMBOLS = Array.from(new Set([...SYMBOLS, ...GROWTH_SYMBOLS]));

// URL generators
export const finvizURL = (symbol: string): string => {
  // Daily chart for growth symbols, weekly for others
  return `https://finviz.com/quote.ashx?t=${symbol}&p=${GROWTH_SYMBOLS.includes(symbol) ? 'd' : 'w'}`;
};

// Financial data URLs
export const URLS = {
  KOSPI: "https://finance.naver.com/sise/sise_index.naver?code=KOSPI",
  KOSDAQ: "https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ",
  US_10Y: "https://ko.tradingeconomics.com/united-states/government-bond-yield",
  FINVIZ_HOME: "https://finviz.com/"
};
