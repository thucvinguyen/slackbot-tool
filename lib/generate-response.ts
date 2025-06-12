import { CoreMessage, generateText, streamText, tool } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { tavily } from "@tavily/core";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

const webSourcesTool = tool({
  description: "Use this to search the web for information",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    try {
      const searchResults = await tavilyClient.search(query, {
        include_answer: true,
        max_results: 5,
      });

      let response = "";
      if (searchResults.answer && searchResults.answer.trim()) {
        response += `${searchResults.answer.trim()}\n\n`;
      } else {
        response += `Here's what I found about *${query}*:\n\n`;
      }

      if (
        Array.isArray(searchResults.results) &&
        searchResults.results.length > 0
      ) {
        const sources = searchResults.results.slice(0, 5).map((r) => {
          return `• ${r.title} | ${r.url}`;
        });

        response += `\n${sources.join("\n")}`;
      }

      console.log("From tool:", response);

      return response;
    } catch (error) {
      console.error("Error in webSources tool:", error);
      return "Sorry, I couldn't retrieve the information at this time.";
    }
  },
});

const getWeatherTool = tool({
  description: "Get the current weather at a location",
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
    city: z.string(),
  }),
  execute: async ({ latitude, longitude, city }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`
    );

    const weatherData = await response.json();

    return {
      temperature: weatherData.current.temperature_2m,
      weatherCode: weatherData.current.weathercode,
      humidity: weatherData.current.relativehumidity_2m,
      city,
    };
  },
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
          - When the user asks anything related to travel, trips, or cities (e.g. "trip to Shanghai", "visiting Paris"), ALWAYS use the "getWeather" tool to include the current weather. Do not guess or skip the weather. Always call the tool, even if the destination is obvious.
          - Format sources as title in the response instead of metadata title`,
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
