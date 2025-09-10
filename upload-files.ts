import { WebClient, LogLevel } from "@slack/web-api";
import fs from "fs";
import path from "path";
import { FINVIZ_SYMBOLS, finvizURL, TEST_RESULT_PATH, SLACK_CHANNEL_ID, UTC_OFFSET_HOURS, URLS } from "./define";

/**
 * Initialize Slack WebClient with proper error handling and appropriate log level
 */
const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
  logLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  retryConfig: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000,
  }
});

/**
 * Get Korean Standard Time formatted timestamp
 */
const getKSTTimestamp = (): string => {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (UTC_OFFSET_HOURS * 60 * 60 * 1000));
  return kstTime.toISOString();
};

/**
 * Get URL source for a given filename
 */
const getUrlFromFilename = (filename: string): string | undefined => {
  // Handle Finviz stock symbols
  for (const symbol of FINVIZ_SYMBOLS) {
    if (filename.includes(symbol)) {
      return finvizURL(symbol);
    }
  }
  
  // Handle other file types with specific URLs
  const urlMap: Record<string, string> = {
    'US_10Y.png': URLS.US_10Y,
    'KOSPI_monthly.png': URLS.KOSPI,
    'KOSDAQ_monthly.png': URLS.KOSDAQ,
    'finviz-home.png': URLS.FINVIZ_HOME
  };
  
  return urlMap[filename];
}

/**
 * Get list of files from the test results directory
 */
const getScreenshotFiles = (): string[] => {
  try {
    return fs.readdirSync(TEST_RESULT_PATH)
      .filter(filename => filename.endsWith('.png'));
  } catch (error) {
    console.error(`Error reading directory ${TEST_RESULT_PATH}:`, error);
    return [];
  }
};

/**
 * Upload screenshots to Slack
 */
const uploadScreenshots = async (): Promise<void> => {
  try {
    // Get all screenshot files
    const files = getScreenshotFiles();
    
    if (files.length === 0) {
      console.warn("No screenshot files found to upload");
      return;
    }
    
    // Check if fear-and-greed.png exists
    const fearAndGreedIndex = files.findIndex(file => file === 'fear-and-greed.png');
    const fearAndGreedFile = fearAndGreedIndex >= 0 ? files[fearAndGreedIndex] : null;
    
    // If fear-and-greed.png exists, remove it from the main files array
    if (fearAndGreedIndex >= 0) {
      files.splice(fearAndGreedIndex, 1);
    }
    
    // Post initial message with fear-and-greed image if it exists
    let initialText = `Market data screenshots - ${getKSTTimestamp()}`;
    let initialMessageTs: string | undefined;
    
    // Upload fear-and-greed image with the main message if it exists
    if (fearAndGreedFile) {
      const fearAndGreedPath = path.join(TEST_RESULT_PATH, fearAndGreedFile);
      
      const fearAndGreedResult = await client.files.uploadV2({
        channels: SLACK_CHANNEL_ID,
        initial_comment: initialText,
        file: fearAndGreedPath,
        filename: fearAndGreedFile
      });
      initialMessageTs = fearAndGreedResult.ts as string;

      if (fearAndGreedResult.ok) {
        console.log(`Successfully uploaded ${fearAndGreedFile} with main message`);
      } else {
        console.error(`Failed to upload ${fearAndGreedFile}: ${fearAndGreedResult.error}`);
      }
    } else {
      // Just post a regular text message if fear-and-greed doesn't exist
      const chatResult = await client.chat.postMessage({
        channel: SLACK_CHANNEL_ID,
        text: initialText,
      });
      
      if (!chatResult.ok || !chatResult.ts) {
        throw new Error(`Failed to post initial message: ${chatResult.error}`);
      }
      initialMessageTs = chatResult.ts;
    }

    const thread_ts = initialMessageTs;

    // If there are remaining files, upload them to the thread
    if (files.length > 0) {
      console.log(`Uploading ${files.length} remaining files to Slack thread...`);
      
      // Process files in batches to avoid rate limits
      const BATCH_SIZE = 5;
      const batches: string[][] = [];
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE));
      }
    
      for (const batch of batches) {
        await Promise.all(
          batch.map(async (fileName) => {
            const url = getUrlFromFilename(fileName);
            const filePath = path.join(TEST_RESULT_PATH, fileName);
            
            try {
              const result = await client.files.uploadV2({
                channels: SLACK_CHANNEL_ID,
                initial_comment: url ? `${fileName} ${url}` : fileName,
                file: filePath,
                filename: fileName,
                thread_ts,
              });
              
              if (result.ok) {
                console.log(`Successfully uploaded ${fileName}`);
              } else {
                console.error(`Failed to upload ${fileName}: ${result.error}`);
              }
            } catch (uploadError) {
              console.error(`Error uploading ${fileName}:`, uploadError);
            }
          })
        );
        
        // Add delay between batches to avoid rate limits
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log('All files uploaded successfully');
    } else {
      console.log('No additional files to upload to thread');
    }
  } catch (error) {
    console.error("Failed to upload screenshots:", error);
    process.exit(1);
  }
};

// Execute the upload function
uploadScreenshots();
