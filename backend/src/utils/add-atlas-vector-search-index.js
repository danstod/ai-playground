export async function addAtlasVectorSearchIndex({ collection, indexName }) {
  // Ensure index does not already exist, then create your Atlas Vector Search index
  // const indexes = await collection.listSearchIndexes("vector_index").toArray();
  const indexes = await collection.listSearchIndexes(indexName).toArray();
  if (indexes.length === 0) {
    // Define your Atlas Vector Search Index
    const index = {
      name: indexName,
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            numDimensions: 1536,
            path: "embedding",
            similarity: "cosine",
          },
          {
            type: "filter",
            path: "loc.pageNumber",
          },
          {
            type: "filter",
            path: "source",
          },
          {
            type: "filter",
            path: "industry",
          },
          {
            type: "filter",
            path: "company_size",
          },
        ],
      },
    };

    // Run the helper method
    const result = await collection.createSearchIndex(index);
    console.log(result);

    // Wait for Atlas to sync index
    console.log("Waiting for initial sync...");
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve();
      }, 10000),
    );
  }
}
