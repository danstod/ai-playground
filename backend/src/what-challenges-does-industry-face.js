import "dotenv/config";
import mongoose from "mongoose";
import vectorStoreService from "./services/vector-store.service.js";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const run = async () => {
  await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

  const vectorStore = await vectorStoreService.getVectorStore({});
  const retriever = vectorStore.asRetriever();
  const prompt =
    PromptTemplate.fromTemplate(`Answer the question based on the following context:
  {context}
  Question: {question}`);
  const model = new ChatOpenAI({});

  const formatDocumentsAsString = (documents) => {
    return documents
      .map((doc) => `${doc.pageContent} [Source: ${doc.metadata.source}]`)
      .join("\n\n");
  };

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    new RunnableLambda({
      func: async (formattedPrompt) => {
        console.log("Formatted Prompt Sent to LLM:", formattedPrompt);
        return formattedPrompt; // Pass it to the model
      },
    }),
    prompt,
    model,
    new StringOutputParser(),
  ]);
  // Prompt the LLM
  const question =
    "Outline the main challenges or pain points the prospect faces. List 5-10 challenges.";
  const answer = await chain.invoke(question);
  console.log("Question: " + question);
  console.log("Answer: " + answer);
  // Return source documents
  const retrievedResults = await retriever.getRelevantDocuments(question);
  const documents = retrievedResults.map((documents) => ({
    pageContent: documents.pageContent,
    source: documents.metadata.source,
    lines: documents.metadata.loc.lines,
  }));
  console.log("\nSource documents:\n" + JSON.stringify(documents, 1, 2));
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
