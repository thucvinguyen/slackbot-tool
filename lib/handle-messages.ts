import type {
  AssistantThreadStartedEvent,
  GenericMessageEvent,
} from "@slack/web-api";
import { client, getThread, updateStatusUtil } from "./slack-utils";
import { generateResponse } from "./generate-response";

export async function assistantThreadMessage(
  event: AssistantThreadStartedEvent
) {
  const { channel_id, thread_ts } = event.assistant_thread;
  console.log(`Thread started: ${channel_id} ${thread_ts}`);
  console.log(JSON.stringify(event));

  await client.chat.postMessage({
    channel: channel_id,
    thread_ts: thread_ts,
    text: "Hello, I'm an AI assistant built with the AI SDK by Vi Nguyen!",
  });

  await client.assistant.threads.setSuggestedPrompts({
    channel_id: channel_id,
    thread_ts: thread_ts,
    prompts: [
      {
        title: "Get the weather",
        message: "What is the current weather in London?",
      },
      {
        title: "Get the news",
        message: "What is the latest Premier League news from the BBC?",
      },
    ],
  });
}

export async function handleNewAssistantMessage(
  event: GenericMessageEvent,
  botUserId: string
) {
  if (
    event.bot_id ||
    event.bot_id === botUserId ||
    event.bot_profile ||
    !event.thread_ts
  )
    return;

  const { thread_ts, channel } = event;
  const updateStatus = updateStatusUtil(channel, thread_ts);

  try {
    await updateStatus("is thinking...");

    const messages = await getThread(channel, thread_ts, botUserId);

    const result = await generateResponse(messages, updateStatus);

    const responseText =
      result?.trim() || "Sorry, I couldn't generate a response.";

    const messagePayload: any = {
      channel: channel,
      thread_ts: thread_ts,
      text: responseText,
      unfurl_links: false,
    };

    if (responseText && responseText.length > 0) {
      messagePayload.blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: responseText,
          },
        },
      ];
    }

    await client.chat.postMessage(messagePayload);
    await updateStatus("");
  } catch (error) {
    console.error("Error handling assistant message:", error);

    const errorMessage = "An error occurred while processing your request.";
    await client.chat.postMessage({
      channel: channel,
      thread_ts: thread_ts,
      text: errorMessage,
    });

    await updateStatus("");
  }
}
