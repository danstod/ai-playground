import "dotenv/config";
import "cheerio";
import { client } from "./db/connection.js";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";

// Retrieve the website URL from the command-line arguments
const websiteUrl = process.argv[2];

// Function to load data from a given URL
const loadDataFromUrl = async (url) => {
  try {
    // Initialize the loader to extract content from <p> tags
    const loader = new CheerioWebBaseLoader(url, {
      selector: "p",
    });

    // Load the content from the URL
    const data = await loader.load();

    // Return the first extracted content and its length
    return {
      content: data[0],
      length: data[0]?.pageContent.length,
    };
  } catch (error) {
    // Log any errors encountered during loading
    console.error("Error loading data from URL:", error.message);
    return null;
  }
};

// Function to determine chunk sizes based on document length
const getChunkSizes = (documentLength) => {
  // Define minimum and maximum chunk sizes
  const MIN_CHUNK_SIZE = 500;
  const MAX_CHUNK_SIZE = 2000;

  // Calculate chunk size as 10% of the document length
  let chunkSize = Math.floor(documentLength * 0.1);

  // Ensure chunk size is within the defined range
  chunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(chunkSize, MAX_CHUNK_SIZE));

  // Set chunk overlap as 10% of the chunk size
  const chunkOverlap = Math.floor(chunkSize * 0.1);

  // Return the calculated chunk size and overlap
  return { chunkSize, chunkOverlap };
};

// Function to split loaded data into chunks
const splitLoadedData = async ({ content, length }) => {
  try {
    // Get chunk size and overlap based on document length
    const { chunkSize, chunkOverlap } = getChunkSizes(length);

    // Initialize the text splitter with the calculated sizes
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize, // Maximum length of each text chunk
      chunkOverlap, // Number of characters that overlap between chunks
    });

    // Split the content into chunks
    const splitDocs = await splitter.splitDocuments([content]);

    // Return the split documents
    return splitDocs;
  } catch (error) {
    // Log any errors encountered during splitting
    console.error(error);
  }
};

// Function to store documents in a vector store
const storeInVectorStore = async ({ docs }) => {
  try {
    // Configure the MongoDB collection
    const database = client.db("test_vector_collection");
    const collection = database.collection("test");
    const dbConfig = {
      collection: collection,
      indexName: "vector_index", // Name of the Atlas search index
      textKey: "text", // Field name for raw text content
      embeddingKey: "embedding", // Field name for vector embeddings
    };

    // Ensure the collection is empty before inserting new documents
    const count = await collection.countDocuments();
    if (count > 0) {
      await collection.deleteMany({});
    }

    // Initialize the vector store with the documents and embeddings
    await MongoDBAtlasVectorSearch.fromDocuments(
      docs,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY, // Retrieve API key from environment variables
      }),
      dbConfig,
    );

    console.log("Successfully stored chunks in the vector store");
  } catch (error) {
    // Log any errors encountered during storage
    console.error("Error storing data in vector store:", error.message);
  }
};

// Main function to index and store data from a URL
const run = async ({ url }) => {
  try {
    // Load data from the specified URL
    const data = await loadDataFromUrl(url);
    console.log("Loading data from the URL:", data);

    // Split the loaded data into chunks
    const splittedData = await splitLoadedData(data);
    console.log("Splitting loaded data into chunks:", splittedData);

    // Store the split data in the vector store
    await storeInVectorStore({ docs: splittedData });
    console.log("Storing data in the vector store completed successfully.");

    // Return success status
    return true;
  } catch (error) {
    // Log any errors encountered during indexing and storage
    console.error("Error indexing and storing:", error.message);
    return false;
  }
};

// Execute the indexing and storage process
run({ url: websiteUrl })
  .then((res) => {
    // Log the result of the process
    console.log("Indexing and storing completed successfully:", res);
  })
  .catch((error) => {
    // Log any errors encountered during execution
    console.error("Error indexing and storing:", error.message);
  });
