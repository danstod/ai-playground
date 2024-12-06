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
import CompaniesModel from "../../models/companies.model.js";

const askQuestion = async ({ question, industry }) => {
  await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

  const vectorStore = await vectorStoreService.getVectorStore({});

  const retrieverParameters = { k: 10 };

  if (industry) {
    if (await CompaniesModel.countDocuments({ industry })) {
      // Only filter on industry, if it exists
      retrieverParameters.filter = {
        preFilter: {
          industry,
        },
      };
    }
  }

  const retriever = vectorStore.asRetriever(retrieverParameters);
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
    new RunnableLambda({
      func: async (formattedPrompt) => {
        //console.log("Formatted Prompt Sent to LLM:", formattedPrompt);
        return formattedPrompt; // Pass it to the model
      },
    }),
    prompt,
    model,
    new StringOutputParser(),
  ]);
  // Prompt the LLM
  const answer = await chain.invoke(question);
  console.log("Question: " + question);
  console.log("Answer: " + answer);
  // Return source documents
  const retrievedResults = await retriever.invoke(question);
  const documents = retrievedResults.map((documents) => ({
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
    "Outline the main challenges or pain points the prospect faces. List 5-10 challenges.",
    "List the desired outcome. List 5-10 outcomes.",
    "List the desired capabilities for a software solution that solves the challenges and achieves the outcomes faced by the prospect. List 5-10 capabilities.",
  ];
  const data = {
    text: [],
    citations: [],
  };

  for (const question of questions) {
    const { text, citations } = await askQuestion({
      question,
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
