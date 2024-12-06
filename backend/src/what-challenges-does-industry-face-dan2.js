import "dotenv/config";
import mongoose from "mongoose";
import vectorStoreService from "./services/vector-store.service.js";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  Runnable,
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
// import { formatDocumentsAsString } from "langchain/util/document";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getScoreThresholdRetriever } from "./rag/retrievers/score-threshold-retriever.js";
import { challengesPrompt } from "./rag/prompts/value-story-prompt-challenges.js";

const run = async () => {
  await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

  const vectorStore = await vectorStoreService.getVectorStore({
    collectionName: "sales-docs-sentences",
    dbName: "ragathon-dan",
  });
  // const retriever = await vectorStore.asRetriever()
  const retriever = await vectorStore.asRetriever({
    searchType: "similarity", // Defaults to "similarity
    // filter: { preFilter: { "loc.pageNumber": { "$eq": 17 } } },
    // searchKwargs: {
    //   fetchK: 20,
    //   lambda: 0.1,
    // },
    k: 1,
    // maxK: 20,
    // minSimilarityScore: 0.01,
    // minSimilarityScore: 0.85,
  });

  // const retriever = getScoreThresholdRetriever({
  //   vectorStore,
  //   maxK: 20,
  //   minSimilarityScore: 0.85,
  // });

  const formatDocumentsAsString = (documents) => {
    return documents
      .map((doc) => `${doc.pageContent} [Source: ${doc.metadata.sourceName}]`)
      .join("\n\n");
  };

  const prompt =
    PromptTemplate.fromTemplate(`Answer the question based on the following context:
  {context}
  Question: {question}`);
  const model = new ChatOpenAI({});
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    // new RunnableLambda(async (formattedPrompt) => {
    //   console.log("Formatted Prompt Sent to LLM:", formattedPrompt);
    //   return formattedPrompt; // Pass it to the model
    // }),
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
  // const question =
  //   "Outline the main challenges or pain points the prospect faces. List 5-10 challenges. Please cite sources in your response like this [Source: example.com]";
  const question = "the main challenges or pain points";
  const answer = await chain.invoke(challengesPrompt);
  console.log("Question: " + question);
  console.log("Answer: " + answer);
  // Return source documents
  const retrievedResults = await retriever.getRelevantDocuments(question);
  const documents = retrievedResults.map((documents) => ({
    pageContent: documents.pageContent,
    // source: documents.metadata.source,
    source: documents.metadata.sourceName,
    // lines: documents.metadata.loc.lines,
  }));
  console.log("\nSource documents:\n" + JSON.stringify(documents, 1, 2));
  console.log(
    "\nretrievedResults:\n" + JSON.stringify(retrievedResults[0], 1, 2),
  );
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
