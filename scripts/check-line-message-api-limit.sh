#!/bin/bash

LINE_ACCESS_TOKEN="${LINE_ACCESS_TOKEN:-}"
SLACK_BOT_TOKEN="${SLACK_BOT_TOKEN:-}"
NOTIFICATION_PERCENTAGE=3 # Notification threshold percentage
SLACK_CHANNEL_ID="C057FBXAGF4" # todo check alert channel

if [ -z "$LINE_ACCESS_TOKEN" ]; then
  echo "Error: LINE_ACCESS_TOKEN environment variable is not set"
  exit 1
fi

if [ -z "$SLACK_BOT_TOKEN" ]; then
  echo "Error: SLACK_BOT_TOKEN environment variable is not set"
  exit 1
fi

totalUsage=$(curl -s -X GET https://api.line.me/v2/bot/message/quota/consumption \
-H "Authorization: Bearer $LINE_ACCESS_TOKEN" | jq '.totalUsage')

value=$(curl -s -X GET https://api.line.me/v2/bot/message/quota \
-H "Authorization: Bearer $LINE_ACCESS_TOKEN" | jq '.value')

echo "Total Usage: $totalUsage"
echo "Quota Value: $value"

if [[ $value -ne 0 ]]; then
  percentage=$(echo "scale=2; ($totalUsage / $value) * 100" | bc)
  echo "Usage: $percentage%"
  
  if (( $(echo "$percentage > $NOTIFICATION_PERCENTAGE" | bc -l) )); then
     curl -X POST \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H 'Content-type: application/json; charset=utf-8' \
    --data-binary \
    "{\"channel\":\"${SLACK_CHANNEL_ID}\",\"text\":\"警告: LINE Message APIの使用率が${percentage}%に達しました！詳細はこちらで確認してください: https://manager.line.biz/account/@560whmnl/insight/message\"}" \
    https://slack.com/api/chat.postMessage
  fi
else
  echo "Quota value is zero, cannot calculate percentage."
fi