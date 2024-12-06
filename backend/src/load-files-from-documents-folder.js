import "dotenv/config";
import { MongoClient } from "mongodb";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { scoreThresholdRetriever } from "./rag/retrievers/score-threshold-retriever.js";
import { convertMongoDocsToLangChainDocs } from "./rag/utils/convert-mongo-docs-to-lang-chain-docs.js";
import { addAtlasVectorSearchIndex } from "./utils/add-atlas-vector-search-index.js";
import * as fs from "fs";
import path from "path";
import { z } from "zod";
import { createMetadataTaggerFromZod } from "langchain/document_transformers/openai_functions";

const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);

const getDocumentFiles = () => {
  const fileNames = [];
  const directoryPath = path.join(process.cwd(), "documents");
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    fileNames.push(path.join(directoryPath, file));
  });

  return fileNames;
};

async function loadFiles({ dbConfig, collection }) {
  for (const localPath of getDocumentFiles()) {
    const loader = new DocxLoader(localPath);

    const langChainDocs = await loader.load();

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

    const taggedDocuments =
      await metadataTagger.transformDocuments(langChainDocs);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const docs = await textSplitter.splitDocuments(taggedDocuments);

    console.log(
      `Documents loaded and split for ${localPath}, chunk size: ${docs.length}`,
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
  const collectionName = "sales-docs";
  const dbName = process.env.DB_NAME || "cuvama-rag";

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
    console.log("Collection is not empty. Deleting all documents...");
    await collection.deleteMany({});
    await loadFiles({ dbConfig, collection });

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
    const searchTerm = "what are the top 3 challenges / pain points";
    await scoreThresholdRetriever({
      vectorStore,
      searchTerm,
    });
  } finally {
    // Ensure that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
