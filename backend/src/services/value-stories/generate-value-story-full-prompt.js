import mongoose from "mongoose";
import vectorStoreService from "../vector-store.service.js";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  RunnableLambda,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { promptContext } from "../../rag/prompts/prompt-context.js";

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

const askQuestion = async ({ promptContext, ragQuestion, industry }) => {
  await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

  const vectorStore = await vectorStoreService.getVectorStore({});

  const formatDocumentsAsString = (documents) => {
    return documents
      .map((doc) => `${doc.pageContent} [Source: ${doc.metadata.source}]`)
      .join("\n\n");
  };

  const docs = await getDocs({ ragQuestion, vectorStore, k: 10 });
  const context = () => formatDocumentsAsString(docs);

  const retrieverParameters = { k: 10 };

  if (industry) {
    retrieverParameters.filter = {
      preFilter: {
        industry,
      },
    };
  }

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
  const answer = await chain.invoke(promptContext);
  // console.log("Question: " + question);
  console.log("Answer: " + answer);
  // Return source documents
  // const retrievedResults = await retriever.invoke(question);
  const documents = docs.map((documents) => ({
    pageContent: documents.pageContent,
    source: documents.metadata.source,
    lines: documents.metadata.loc.lines,
  }));

  return { text: answer, citations: documents };
};

const generateValueStory = async ({
  companyName,
  industry,
  companySize,
  hasValueEngineers,
}) => {
  const questions = [
    "Outline the main challenges or pain points the prospect faces. List 5 challenges.",
    "List the desired outcome. List 5 outcomes.",
    "List the desired capabilities for a software solution that solves the challenges and achieves the outcomes faced by the prospect. List 5-10 capabilities.",
  ];
  const data = {
    text: [],
    citations: [],
  };

  for (const ragQuestion of questions) {
    const { text, citations } = await askQuestion({
      promptContext,
      ragQuestion,
      industry,
    });

    console.log("text", text);
    console.log("citations", citations);

    data.text.push(text);
    data.citations.push(citations);
  }

  return data;
};

export default generateValueStory;
