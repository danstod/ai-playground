import { MongoClient } from "mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

let vectorStore = null;

async function getVectorStore({
  collectionName = "sales-docs",
  dbName = "ragathon-edgar",
}) {
  const connectionString = process.env.ATLAS_CONNECTION_STRING;
  console.log(
    `Getting Vector from dbName: ${dbName}, collectionName: ${collectionName}, connectionString: ${connectionString}`,
  );
  if (!vectorStore) {
    const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
    const database = client.db(process.env.DB_NAME || dbName);
    const collection = database.collection(collectionName);
    const dbConfig = {
      collection: collection,
      indexName: "default", // The name of the Atlas search index to use.
      textKey: "text", // Field name for the raw text content. Defaults to "text".
      embeddingKey: "embedding", // Field name for the vector embeddings. Defaults to "embedding".
    };
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize MongoDBAtlasVectorSearch without loading data into the database
    vectorStore = new MongoDBAtlasVectorSearch(embeddings, dbConfig);
  }

  return vectorStore;
}

async function semanticSearch({ searchTerm, preFilter = {} }) {
  const vectorStore = await getVectorStore({});

  const filteredOutput = await vectorStore.similaritySearch(
    searchTerm,
    3,
    preFilter,
  );

  return filteredOutput.map((results) => ({
    pageContent: results.pageContent,
    pageNumber: results.metadata.loc.pageNumber,
    source: results.metadata.source,
  }));
}

export default { getVectorStore, semanticSearch };
