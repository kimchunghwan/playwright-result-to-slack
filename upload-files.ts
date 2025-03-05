import { WebClient, LogLevel } from "@slack/web-api";
import fs from "fs";
import { FINVIZ_SYMBOLS, finvizURL } from "./define";
// WebClient instantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.
const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
  // LogLevel can be imported and used to make debugging simpler
  logLevel: LogLevel.DEBUG,
});

const UTC_9 = 9 * 60 * 60 * 1000;

// The name of the file you're going to upload
const folder = "./test-results/";
// ID of channel that #stock
const channelId = "C032JKDP3TJ";

const uploadFile = async () => {
  try {
    const chatResult = await client.chat.postMessage({
      channel: channelId,
      text: new Date(new Date().getTime() + UTC_9).toISOString(),
    });
    const thread_ts = chatResult.ts;
    const files = await getfiles(folder);
    const result = await Promise.all(
      files.map(async (fileName) => {
        const url = getUrlFromFilename(fileName);
        const result = await client.files.uploadV2({
          // channels can be a list of one to many strings
          channels: channelId,
          initial_comment: `${fileName} :smile: ${url}`,
          file: folder + fileName,
          filename: fileName,
          thread_ts,
        });
        console.log(result);
      })
    );
  } catch (error) {
    console.error(error);
  }
};

const getfiles = async (folder: string) => {
  // get files list in  test-results folder

  const files: string[] = fs.readdirSync(folder);
  return files;
};

const getUrlFromFilename = (filename: string) => {
  for (let symbol of FINVIZ_SYMBOLS) {
    if (filename.includes(symbol)) {
      return finvizURL(symbol);
    }
  }
  if (filename === 'US_10Y.png') {
    return 'https://ko.tradingeconomics.com/united-states/government-bond-yield';
  }
};

uploadFile();
