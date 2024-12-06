import "dotenv/config";
import { formatDocumentsAsString } from "langchain/util/document";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
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
} from "./get-files-from-dropbox.js";
import officeParser from "officeparser";
import { createMetadataTaggerFromZod } from "langchain/document_transformers/openai_functions";
import { z } from "zod";
import { convertMongoDocsToLangChainDocs } from "./rag/utils/convert-mongo-docs-to-lang-chain-docs.js";
import { addAtlasVectorSearchIndex } from "./utils/add-atlas-vector-search-index.js";

const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);

async function basicSemanticSearch({ vectorStore, searchTerm }) {
  // Basic semantic search
  const basicOutput = await vectorStore.similaritySearch(searchTerm, 10);
  // "plant wisdom",
  // "MongoDB Atlas security",
  const basicResults = basicOutput.map((results) => ({
    pageContent: results.pageContent,
    pageNumber: results.metadata.loc.pageNumber,
    source: results.metadata.source,
  }));
  console.log("Basic Semantic Search Results:", basicResults.length);
  console.log(basicResults);
}

async function semanticSearch({ vectorStore, searchTerm, preFilter = {} }) {
  // Semantic search with metadata filter
  const filteredOutput = await vectorStore.similaritySearch(
    // "MongoDB Atlas security",
    searchTerm,
    3,
    preFilter,
    // {
    //   preFilter: {
    //     "loc.pageNumber": { $eq: 17 },
    //   },
    // },
  );
  const filteredResults = filteredOutput.map((results) => ({
    pageContent: results.pageContent,
    pageNumber: results.metadata.loc.pageNumber,
    source: results.metadata.source,
  }));
  console.log(
    "Semantic Search with Filtering Results:",
    filteredResults.length,
  );
  console.log(filteredResults);
}

async function maxMarginalRelevanceSearch({ vectorStore, searchTerm }) {
  // Max Marginal Relevance search
  const mmrOutput = await vectorStore.maxMarginalRelevanceSearch(
    searchTerm,
    // "MongoDB Atlas security",
    {
      k: 10, //The number of documents to return in the final results. This is the primary count of documents that are most relevant to the query.
      fetchK: 500, //The initial number of documents to retrieve from the vector store before applying the MMR algorithm. This larger set provides a pool of documents from which the algorithm can select the most diverse results based on relevance to the query.
    },
  );
  const mmrResults = mmrOutput.map((results) => ({
    pageContent: results.pageContent,
    pageNumber: results.metadata.loc.pageNumber,
    source: results.metadata.source,
  }));
  console.log("Max Marginal Relevance Search Results:", mmrResults.length);
  console.log(mmrResults);
}

async function loadLocalFiles({ localFileNames, dbConfig, collection }) {
  for (const localFileName of localFileNames) {
    const loader = new PDFLoader(localFileName);
    // const loader = new PDFLoader(`atlas_best_practices.pdf`);
    const data = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 20,
    });
    const docs = await textSplitter.splitDocuments(data);
    console.log(
      `Documents loaded and split for ${localFileName}:`,
      docs.length,
      docs[0],
    );

    const vectorStore = await MongoDBAtlasVectorSearch.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      dbConfig,
    );
  }

  await addAtlasVectorSearchIndex({
    collection,
    indexName: dbConfig.indexName,
  });
}

async function loadFiles({ dropboxFiles, dbConfig, collection }) {
  for (const dropboxFile of dropboxFiles) {
    const localPath = await downloadFileFromDropbox(dropboxFile);
    const text = await officeParser.parseOfficeAsync(localPath);
    const langChainDoc = new Document({
      pageContent: text,
      metadata: { source: dropboxFile.name },
    });

    const zodSchema = z.object({
      company_name: z.string(),
      industry: z
        .string()
        .describe("A short 2-3 word summary of the company's industry"),
      company_size: z
        .number()
        .describe("The number of employees in the company"),
      bve: z
        .boolean()
        .describe(
          "Whether or not the company currently employs business value engineers",
        ),
    });

    const metadataTagger = createMetadataTaggerFromZod(zodSchema, {
      llm: new ChatOpenAI({ model: "gpt-3.5-turbo" }),
    });

    const taggedDocuments = await metadataTagger.transformDocuments([
      langChainDoc,
    ]);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 20,
    });
    const docs = await textSplitter.splitDocuments(taggedDocuments);

    console.log(
      `Documents loaded and split for ${dropboxFile.path_display}, chunk size: ${docs.length}`,
    );

    await MongoDBAtlasVectorSearch.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      dbConfig,
    );
  }

  await addAtlasVectorSearchIndex({
    collection,
    indexName: dbConfig.indexName,
  });
}

async function run() {
  const refreshDocs = true;
  const readFromDropbox = true;
  const collectionName = "sales-docs";
  const dbName = process.env.DB_NAME || "cuvama-rag";
  const dropboxFolderName = "/rag/sales-docs";

  // if (refreshDocs) {
  //   const files = await getFilesFromDropbox({ folderName: dropboxFolderName });
  //   console.log(files);
  //   await downloadFileFromDropbox(files[0]);
  //   return;
  // }

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

    if (refreshDocs) {
      const count = await collection.countDocuments();

      if (count) {
        console.log("Collection is not empty. Deleting all documents...");
        await collection.deleteMany({});
      }
      if (readFromDropbox) {
        const dropboxFiles = await getFilesFromDropbox({
          folderName: dropboxFolderName,
        });
        await loadFiles({ dropboxFiles, dbConfig, collection });
      } else {
        // This is the example from MongoDB
        // https://www.mongodb.com/docs/atlas/atlas-vector-search/ai-integrations/langchain-js/
        const rawData = await fetch(
          "https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4HkJP",
        );
        const pdfBuffer = await rawData.arrayBuffer();
        const pdfData = Buffer.from(pdfBuffer);
        fs.writeFileSync("atlas_best_practices.pdf", pdfData);
        await loadLocalFiles({
          localFileNames: ["atlas_best_practices.pdf"],
          dbConfig,
          collection,
        });
      }
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
    const searchTerm = "what are the challenges and pain points";
    await basicSemanticSearch({
      vectorStore,
      searchTerm,
    });
    await maxMarginalRelevanceSearch({
      vectorStore,
      searchTerm,
    });
    await semanticSearch({
      vectorStore,
      searchTerm,
      preFilter: { source: { $eq: "./mongodb-case-study.doc" } },
    });
  } finally {
    // Ensure that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
