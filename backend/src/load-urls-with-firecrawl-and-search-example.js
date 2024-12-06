import "dotenv/config";
import { formatDocumentsAsString } from "langchain/util/document";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as fs from "fs";
import { Document } from "langchain/document";
import {
  downloadFileFromDropbox,
  fileToArrayBuffer,
  getFilesFromDropbox,
} from "../../../ragathon_old/backend/src/get-files-from-dropbox.js";
import officeParser from "officeparser";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { getLangChainDocsFromUrl } from "./rag/loaders/get-langchain-docs-from-url.js";
import { addAtlasVectorSearchIndex } from "./utils/add-atlas-vector-search-index.js";
import { maxMarginalRelevanceSearch } from "./rag/retrievers/max-marginal-relevance-search.js";
import { semanticSearchWithPreFilter } from "./rag/retrievers/semantic-search-with-pre-filter.js";
import { basicSemanticSearch } from "./rag/retrievers/basic-semantic-search.js";
import { scoreThresholdRetriever } from "./rag/retrievers/score-threshold-retriever.js";
import SentenceSplitterShortSentences from "./rag/text-splitters/sentence-splitter-short-sentences.js";
import { convertMongoDocsToLangChainDocs } from "./rag/utils/convert-mongo-docs-to-lang-chain-docs.js";

const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const dataCleaner = (docs) => {
  const cleanedDocs = [];
  const sectionNameToRemove = "#### About Cuvama";
  for (const doc of docs) {
    let pageContent = doc.pageContent
      .split(sectionNameToRemove)[0]
      .replace(sectionNameToRemove, "");
    const newDoc = { ...doc, pageContent };
    cleanedDocs.push(newDoc);
  }

  return cleanedDocs;
};

async function loadHtmlLinks({ urls, dbConfig, collection }) {
  for (const url of urls) {
    try {
      const langChainDocs = await getLangChainDocsFromUrl({ url, dataCleaner });
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 400,
        chunkOverlap: 0,
      });
      const splitter = new SentenceSplitterShortSentences(200);
      const docs = splitter.splitDocuments(langChainDocs);
      // const docs = await textSplitter.splitDocuments(langChainDocs);
      docs.forEach((doc) => {
        doc.metadata.sourceType = "url";
        doc.metadata.docType = "case-study";
        doc.metadata.sourceName = url;
      });
      console.log(
        `Documents loaded and split for ${url}, chunk size: ${docs.length}`,
      );

      await MongoDBAtlasVectorSearch.fromDocuments(
        docs,
        new OpenAIEmbeddings(),
        dbConfig,
      );
      console.log("Sleep for 10 seconds...");
      await sleep(10000);
    } catch (err) {
      console.error(`Error parsing ${url}:`, err);
    }
  }

  await addAtlasVectorSearchIndex({
    collection,
    indexName: dbConfig.indexName,
  });
}

async function run() {
  const loadDocs = false;
  const deleteAllDocs = false;
  const collectionName = "sales-docs-sentences-200";
  // const dbName = "ragathon-edgar";
  const dbName = "ragathon-dan";
  // const dbName = "cuvama-rag";

  const urls = [
    // "https://cuvama.com/value-champion-how-to-enable-an-organization-to-sell-value-as-a-team-of-one/",
    // "https://cuvama.com/jaggaer-and-cuvama/",
    // "https://cuvama.com/eploy-and-cuvama/",
    // "https://cuvama.com/adapt-it-and-cuvama/",
    // "https://cuvama.com/pricefx-and-cuvama/",
    // "https://cuvama.com/rfgen-adopts-cuvama/",
    // "https://cuvama.com/pros-joins-forces-with-cuvama-to-revolutionize-solution-selling/",
    // "https://cuvama.com/customer-story-jedox/",
    // "https://cuvama.com/bettercloud-customer-story/",
    // "https://cuvama.com/altrio-deploys-cuvama-to-scale-the-business/",
    // "https://cuvama.com/bettercloud-adopts-cuvama-scale-value-selling-value-management/",
    // "https://cuvama.com/resources/cuvama-and-zellis-expand-relationship/",
    // "https://cuvama.com/resources/cuvama-and-jedox-announce-the-continuation-of-their-collaboration/",
    // "https://cuvama.com/resources/customer-story-zellis/",
  ];

  // const langChainDocs = await getLangChainDocsFromUrl({
  //   url: urls[0],
  //   dataCleaner,
  // });
  // console.log("langChainDocs", langChainDocs);
  // return;

  try {
    // Configure your Atlas collection
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const dbConfig = {
      collection: collection,
      indexName: "default", // The name of the Atlas search index to use.
      textKey: "text", // Field name for the raw text content. Defaults to "text".
      embeddingKey: "embedding", // Field name for the vector embeddings. Defaults to "embedding".
    };

    let docs;
    let vectorStore;

    if (loadDocs) {
      if (deleteAllDocs) {
        console.log("Deleting all documents...");
        await collection.deleteMany({});
      }

      await loadHtmlLinks({ urls, dbConfig, collection });
    }

    const dbDocs = await collection.find({}).toArray();
    docs = convertMongoDocsToLangChainDocs(dbDocs);
    console.log("Documents loaded from DB:", docs.length);

    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize MongoDBAtlasVectorSearch without loading data into the database
    vectorStore = new MongoDBAtlasVectorSearch(embeddings, dbConfig);

    // Add an index if not already present
    await addAtlasVectorSearchIndex({
      collection,
      indexName: dbConfig.indexName,
    });

    // Now search the Vector DB
    const searchTerm = "most common challenges";
    // const searchTerm = "business critical";
    await scoreThresholdRetriever({
      vectorStore,
      searchTerm,
      maxK: 3,
      // minSimilarityScore: 0.01,
      minSimilarityScore: 0.02,
    });
    // await basicSemanticSearch({
    //   vectorStore,
    //   searchTerm,
    // });
    // await maxMarginalRelevanceSearch({
    //   vectorStore,
    //   searchTerm,
    // });
    // await semanticSearchWithPreFilter({
    //   vectorStore,
    //   searchTerm,
    //   // preFilter: { source: { $eq: "./mongodb-case-study.doc" } },
    // });
  } finally {
    // Ensure that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
