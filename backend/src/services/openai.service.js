import OpenAI from "openai";

let openAIClient;

const getClient = () => {
  if (!openAIClient) {
    openAIClient = new OpenAI();
  }

  return openAIClient;
};

const chatCompletion = async ({
  model = "gpt-4o",
  messages,
  temperature = 0.7,
}) => {
  return getClient().chat.completions.create({
    model,
    messages,
    temperature,
  });
};

const getCodeFromResponse = (s) => {
  if (!s || s.indexOf("```") === -1) {
    return s;
  }
  let inCode = false;
  let string = "";

  for (const line of s.split("\n")) {
    if (line.indexOf("```") === 0) {
      inCode = !inCode;
    } else if (inCode) {
      string += line + "\n";
    }
  }

  return string.trim();
};

export default {
  chatCompletion,
  getCodeFromResponse,
};
