import { getPerplexityAIResponse } from "./services/perplexityai.service.js";

const run = async () => {
  const res = await getPerplexityAIResponse({
    userPrompt:
      "I am a salesperson and am about to have a call with a senior employee at Netflix. I wish to know the latest business news about Netflix so that I am fully up-to-date with their current strategy and future plans. PLease do not include news about specific program releases. For the second section I wish to see news about competitors in the same industry. Please provide at least 5 relevant points for each section",
    model: "llama-3.1-sonar-small-128k-online",
  });

  console.log(JSON.stringify(res, null, 4));
};

// run();
