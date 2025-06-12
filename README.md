# AI SDK Slackbot

An AI-powered chatbot for Slack followed the tutorial of [AI SDK by Vercel](https://ai-sdk.dev/docs/guides/slackbot).

## Features

- Integrates with [Slack's API](https://api.slack.com) for easy Slack communication
- Use any LLM with the AI SDK ([easily switch between providers](https://sdk.vercel.ai/providers/ai-sdk-providers))
- Works both with app mentions and as an assistant in direct messages
- Maintains conversation context within both threads and direct messages
- Built-in tool for enhanced capabilities:
  - Web sources (powered by [Tavily](https://www.tavily.com/))
- Easily extensible architecture to add custom tools (e.g., knowledge search)

## Usage

The bot will respond to:

1. Direct messages - Send a DM to your bot
2. Mentions - Mention your bot in a channel using `@YourBotName`

The bot maintains context within both threads and direct messages, so it can follow along with the conversation.

### Available Tools

1. **Web Sources**: The bot can search the web for up-to-date information using [Tavily](https://www.tavily.com/).

   - Example: "What's the price of BTC today?"

2. **Get Weather**: The bot will add the weather of any destinations to the answer.
   - Example: "Trip to Shanghai"
