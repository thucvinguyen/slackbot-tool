import { CoreMessage, generateText, streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import dotenv from "dotenv";
import getWeatherTool from "../tools/getWeather";
import webSourcesTool from "../tools/getWebSources";

dotenv.config();

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

export const generateResponse = async (
  messages: CoreMessage[],
  updateStatus?: (status: string) => void
): Promise<string> => {
  try {
    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      system: `You are a Slack bot assistant. Keep responses concise.
    - Current date: ${new Date().toISOString().split("T")[0]}
    - If the user's question is about trends, forecasts, resources about some topics (e.g. "music", "learning", "trend") or recent developments (e.g. "AI trends", "latest in healthcare AI"), you MUST use the "webSources" tool immediately. You must ALWAYS include all results in the response, in this format:

    [Your main answer here]

    ==================================================

    Related topics:
    [Tavily tool answer here]

    ==================================================
    - When the user asks anything related to travel, trips, or cities (e.g. "trip to Shanghai", "visiting Paris"), ALWAYS use the "getWeather" tool to include the current weather. Do not guess or skip the weather. Always call the tool, even if the destination is obvious.`,
      messages,
      maxTokens: 1000,
      tools: {
        webSources: webSourcesTool,
        getWeather: getWeatherTool,
      },
      maxSteps: 10,
    });

    const formattedText = text
      .replace(/\[(.*?)\]\((.*?)\)/g, "<$2|$1>")
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      .trim();

    if (typeof updateStatus === "function") {
      updateStatus(formattedText);
    }
    console.log("From deepseek:", formattedText);

    return formattedText;
  } catch (error) {
    console.error("Error in generateResponse:", error);

    const errorMessage =
      "Sorry, I couldn't generate a response. Please try again.";
    if (typeof updateStatus === "function") {
      updateStatus(errorMessage);
    }

    return errorMessage;
  }
};
