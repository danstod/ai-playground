import "dotenv/config";
const token = process.env.PERPLEXITY_API_KEY;

export const getPerplexityAIResponse = async ({
  systemPrompt = "Be precise and concise.",
  userPrompt,
  model = "llama-3.1-sonar-small-128k-online",
}) => {
  const body = `{"model":"${model}","messages":[{"content":"${systemPrompt}","role":"system"},{"content": "${userPrompt}","role":"user"}], "search_domain_filter":["https://www.bbc.com/news"]}`;
  console.log("body", JSON.parse(body));
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  };

  const requestStart = new Date();

  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options,
  );
  let res = await response.json();
  res.requestStart = requestStart;
  res.requestEnd = new Date();
  console.log("res", res);
  return res;
};
