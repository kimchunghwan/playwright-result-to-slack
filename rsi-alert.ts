import YahooFinance from "yahoo-finance2";
import { WebClient, LogLevel } from "@slack/web-api";
import { FINVIZ_SYMBOLS, KR_SYMBOLS, SLACK_CHANNEL_ID, finvizURL, naverURL } from "./define";

const yahooFinance = new YahooFinance({ suppressNotices: ["ripHistorical"] });

const RSI_PERIOD = 14;
const SIGNAL_PERIOD = 9;
const MA_SHORT = 20;
const MA_MID = 50;
const MA_LONG = 200;
const RSI_THRESHOLD = 35; // Alert when RSI(14) ≤ 35 (oversold)

const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
  logLevel: LogLevel.ERROR,
});

type Currency = "USD" | "KRW";

interface StockIndicators {
  symbol: string;    // display label (e.g. "TSLA" or "005930")
  chartUrl: string;  // Finviz or Naver Finance URL
  currency: Currency;
  price: number;
  rsi: number;
  signal: number;
  ma20: number;
  ma50: number;
  ma200: number;
}

/** Format price based on currency */
function formatPrice(price: number, currency: Currency): string {
  if (currency === "KRW") {
    return `₩${Math.round(price).toLocaleString("en-US")}`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate RSI(14), Signal(9), MA20, MA50, MA200 from closing price series
 */
function calculateIndicators(closes: number[]): Omit<StockIndicators, "symbol" | "chartUrl" | "currency"> | null {
  if (closes.length < Math.max(RSI_PERIOD + SIGNAL_PERIOD, MA_LONG)) return null;

  // --- RSI(14) + Signal(9) ---
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));
  const toRSI = (ag: number, al: number) =>
    al === 0 ? 100 : 100 - 100 / (1 + ag / al);

  let avgGain = gains.slice(0, RSI_PERIOD).reduce((a, b) => a + b, 0) / RSI_PERIOD;
  let avgLoss = losses.slice(0, RSI_PERIOD).reduce((a, b) => a + b, 0) / RSI_PERIOD;

  const rsiSeries: number[] = [toRSI(avgGain, avgLoss)];
  for (let i = RSI_PERIOD; i < changes.length; i++) {
    avgGain = (avgGain * (RSI_PERIOD - 1) + gains[i]) / RSI_PERIOD;
    avgLoss = (avgLoss * (RSI_PERIOD - 1) + losses[i]) / RSI_PERIOD;
    rsiSeries.push(toRSI(avgGain, avgLoss));
  }
  if (rsiSeries.length < SIGNAL_PERIOD) return null;

  const k = 2 / (SIGNAL_PERIOD + 1);
  let signal = rsiSeries.slice(0, SIGNAL_PERIOD).reduce((a, b) => a + b, 0) / SIGNAL_PERIOD;
  for (let i = SIGNAL_PERIOD; i < rsiSeries.length; i++) {
    signal = rsiSeries[i] * k + signal * (1 - k);
  }

  // --- MA20 / MA50 / MA200 (SMA) ---
  const sma = (n: number) =>
    closes.slice(-n).reduce((a, b) => a + b, 0) / n;

  return {
    price: closes[closes.length - 1],
    rsi: rsiSeries[rsiSeries.length - 1],
    signal,
    ma20: sma(MA_SHORT),
    ma50: sma(MA_MID),
    ma200: sma(MA_LONG),
  };
}

/**
 * Fetch price data and calculate all indicators via Yahoo Finance
 */
async function fetchIndicators(
  yahooSymbol: string
): Promise<Omit<StockIndicators, "symbol" | "chartUrl" | "currency"> | null> {
  const period1 = new Date();
  period1.setDate(period1.getDate() - 400); // ~280 trading days — covers MA200 + stable Wilder's RSI

  const result = await yahooFinance.chart(yahooSymbol, {
    period1,
    interval: "1d",
  });

  const quotes = result?.quotes;
  if (!quotes || quotes.length < Math.max(RSI_PERIOD + SIGNAL_PERIOD, MA_LONG) + 1) {
    console.warn(`Not enough data for ${yahooSymbol} (got ${quotes?.length ?? 0} rows)`);
    return null;
  }

  const closes = quotes.map((q) => q.close).filter((c): c is number => c !== null);
  return calculateIndicators(closes);
}

/**
 * Send Slack alert for stocks with RSI below threshold
 */
async function sendSlackAlert(stocks: StockIndicators[], market: string): Promise<void> {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // UTC+9
  const dateStr = now.toISOString().replace("T", " ").slice(0, 16);

  const stockLines = stocks
    .sort((a, b) => a.rsi - b.rsi)
    .map((s) => {
      const rsiArrow = s.rsi < s.signal ? ":arrow_down_small:" : ":arrow_up_small:";
      const fp = formatPrice(s.price, s.currency);
      const fm = (n: number) => formatPrice(n, s.currency);
      const maLine =
        `MA20 \`${fm(s.ma20)}\` ${s.price >= s.ma20 ? ":large_green_circle:" : ":red_circle:"}  ` +
        `MA50 \`${fm(s.ma50)}\` ${s.price >= s.ma50 ? ":large_green_circle:" : ":red_circle:"}  ` +
        `MA200 \`${fm(s.ma200)}\` ${s.price >= s.ma200 ? ":large_green_circle:" : ":red_circle:"}`;

      return (
        `• *<${s.chartUrl}|${s.symbol}>*  Price \`${fp}\`\n` +
        `  RSI(14) \`${s.rsi.toFixed(2)}\`  Signal(9) \`${s.signal.toFixed(2)}\` ${rsiArrow}\n` +
        `  ${maLine}`
      );
    })
    .join("\n\n");

  const message =
    `*:rotating_light: RSI Oversold Alert — ${market}  (RSI(14) ≤ ${RSI_THRESHOLD})*\n` +
    `_${dateStr} KST_\n\n` +
    `${stockLines}\n\n` +
    `_:large_green_circle: price above MA  :red_circle: price below MA_`;

  await client.chat.postMessage({
    channel: SLACK_CHANNEL_ID,
    text: message,
    mrkdwn: true,
  });

  console.log(`[${market}] Slack alert sent for ${stocks.length} stock(s).`);
}

/**
 * Check a list of symbols and collect oversold stocks
 */
async function collectOversold(
  symbols: string[],
  toYahooSymbol: (s: string) => string,
  toChartUrl: (s: string) => string,
  currency: Currency
): Promise<StockIndicators[]> {
  const result: StockIndicators[] = [];
  const CHUNK_SIZE = 5;

  for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
    const chunk = symbols.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map(async (symbol) => {
      const yahooSymbol = toYahooSymbol(symbol);
      try {
        const ind = await fetchIndicators(yahooSymbol);
        if (ind === null) return null;

        console.log(
          `${symbol}: ${formatPrice(ind.price, currency)}  RSI(14)=${ind.rsi.toFixed(2)}  ` +
          `Signal(9)=${ind.signal.toFixed(2)}  MA20=${ind.ma20.toFixed(0)}  MA50=${ind.ma50.toFixed(0)}  MA200=${ind.ma200.toFixed(0)}`
        );

        if (ind.rsi <= RSI_THRESHOLD) {
          return { symbol, chartUrl: toChartUrl(symbol), currency, ...ind };
        }
      } catch (error) {
        console.error(`Error processing ${symbol}: ${error}`);
      }
      return null;
    });

    const chunkResults = await Promise.all(promises);
    for (const res of chunkResults) {
      if (res) result.push(res);
    }
  }

  return result;
}

/**
 * Main: check RSI(14)(9) + MA20/50/200 for US and KOSPI stocks
 */
async function checkRSIAndAlert(): Promise<void> {
  console.log(
    `Checking RSI(${RSI_PERIOD})(${SIGNAL_PERIOD}) + MA${MA_SHORT}/MA${MA_MID}/MA${MA_LONG} ` +
    `for ${FINVIZ_SYMBOLS.length} US + ${KR_SYMBOLS.length} KOSPI symbols...`
  );

  // US stocks (Finviz symbols, USD)
  const usAlerts = await collectOversold(
    FINVIZ_SYMBOLS,
    (s) => s,                // Yahoo Finance symbol = ticker
    (s) => finvizURL(s),
    "USD"
  );

  // KOSPI stocks (code + .KS for Yahoo Finance, KRW)
  console.log("\n--- KOSPI ---");
  const krAlerts = await collectOversold(
    KR_SYMBOLS,
    (s) => `${s}.KS`,       // Yahoo Finance symbol
    (s) => naverURL(s),
    "KRW"
  );

  // Send alerts per market (only if oversold stocks exist)
  if (usAlerts.length > 0) {
    await sendSlackAlert(usAlerts, "US");
  } else {
    console.log("No US stocks with RSI ≤ 30.");
  }

  if (krAlerts.length > 0) {
    await sendSlackAlert(krAlerts, "KOSPI");
  } else {
    console.log("No KOSPI stocks with RSI ≤ 30.");
  }

  if (usAlerts.length === 0 && krAlerts.length === 0) {
    console.log(`No stocks with RSI(14) ≤ ${RSI_THRESHOLD}. No alert sent.`);
  }
}

checkRSIAndAlert().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
