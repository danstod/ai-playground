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
import { challengesPrompt } from "./rag/prompts/value-story-prompt-challenges.js";
import { getScoreThresholdRetrieverDocuments } from "./rag/retrievers/score-threshold-retriever.js";

/*

  In LangchainJS, searchType options like similarity and MMR (Maximal Marginal Relevance) are methods used to retrieve relevant documents, each with a different approach in balancing relevance and diversity:

  1. Similarity
  This method ranks documents purely based on their similarity to the query.
  Best for: Scenarios where relevance is the only priority, and you want to retrieve the most similar documents to the query.
  How it works: Uses cosine similarity or another similarity metric to measure closeness to the query.
  Limitations: Can lead to redundancy, especially if similar documents or passages are heavily clustered around certain topics. If you need a variety in the responses, similarity alone may not offer that.

  2. MMR (Maximal Marginal Relevance)
  MMR balances relevance and diversity. It aims to retrieve documents that are relevant to the query while also ensuring that each document differs enough from the others.
  Best for: Scenarios where a diverse set of relevant documents is desirable, especially for complex queries that may touch on multiple subtopics.
  How it works: Alternates between picking the most relevant documents and those that are different from already selected ones.
  Limitations: Slightly slower than a pure similarity search, as it computes both similarity and diversity for each document retrieved.
  
  In summary:

  Use similarity if you need high relevance and can tolerate redundancy.
  Use MMR if you want a more diverse set of documents that are still relevant to your query.
 */

const getDocs = async ({ ragQuestion, vectorStore, k }) => {
  const retriever = vectorStore.asRetriever({
    searchType: "similarity", // "mmr"
    k,
    filter: { company_size: { $gt: 2000 } },
  });
  console.log(
    `getDocs: using vectorStore.asRetriever with k = ${k}, searchType = ${retriever.lc_kwargs.searchType}`,
  );

  return await retriever.invoke(ragQuestion);
};

const getDocs2 = async ({ ragQuestion, vectorStore, k }) => {
  const minSimilarityScore = 0.9;
  console.log(
    `getDocs: using ScoreThresholdRetriever with k = ${k}, minSimilarityScore = ${minSimilarityScore}`,
  );
  return await getScoreThresholdRetrieverDocuments({
    searchTerm: ragQuestion,
    vectorStore,
    maxK: 100,
    kIncrement: 2,
    minSimilarityScore,
  });
};

const run = async () => {
  await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

  const vectorStore = await vectorStoreService.getVectorStore({});

  const formatDocumentsAsString = (documents) => {
    return documents
      .map((doc) => `${doc.pageContent} [Source: ${doc.metadata.source}]`)
      .join("\n\n");
  };

  const ragQuestion = "the main challenges or pain points";

  const docs = await getDocs({ ragQuestion, vectorStore, k: 10 });

  const context = () => formatDocumentsAsString(docs);

  const prompt =
    PromptTemplate.fromTemplate(`Answer the question based on the following context:
  {context}
  Question: {question}`);
  const model = new ChatOpenAI({});
  const chain = RunnableSequence.from([
    {
      context,
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
  const answer = await chain.invoke(challengesPrompt);
  console.log("Answer: " + answer);

  const documents = docs.map((documents) => ({
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
