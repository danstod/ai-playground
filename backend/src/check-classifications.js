import "dotenv/config";
import Companies from "./models/companies.model.js";
import mongoose from "mongoose";
import vectorStoreService from "./services/vector-store.service.js";
import openAIService from "./services/openai.service.js";

const retrieveAnswer = (s) => {
  try {
    const object = JSON.parse(openAIService.getCodeFromResponse(s));
    return object?.answer;
  } catch (e) {}
};

const run = async () => {
  await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

  for (const company of await Companies.find({})) {
    const questions = [
      {
        question: "What is the name of the company?",
        expectedAnswer: company.companyName,
      },
      {
        question:
          "Which industry is this company in? Use a short 2-3 word summary of the company's industry.",
        expectedAnswer: company.industry,
      },
      {
        question: "What is the number of employees in the company?",
        expectedAnswer: company.companySize,
      },
      {
        question:
          "Does the company currently employs business value engineers, true or false",
        expectedAnswer: company.bve,
      },
    ];

    console.log(`\n\n${company.source}: ${company.companyName}`);

    for (const question of questions) {
      const searchResults = await vectorStoreService.semanticSearch({
        searchTerm: question.question,
        preFilter: { source: company.source },
      });

      const messages = [
        {
          role: "user",
          content:
            "Answer this user query: " +
            question.question +
            " with the following context: " +
            searchResults.map((data) => data.pageContent).join("\n") +
            "\n\n Format the response as a JSON object with one field - 'answer' and enclosed the JSON with ```",
        },
      ];

      const completions = await openAIService.chatCompletion({ messages });

      console.log("\nQUESTION:", question.question);
      console.log("ANSWER:", question.expectedAnswer);
      console.log(
        "ANSWER:",
        retrieveAnswer(completions.choices[0].message.content),
      );
    }
  }
};

run()
  .then(() => {
    console.log("success");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
