import { z } from "zod";
import { tool } from "ai";

import { tavily } from "@tavily/core";
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

export default webSourcesTool;
