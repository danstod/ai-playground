export async function basicSemanticSearch({ vectorStore, searchTerm }) {
  // Basic semantic search
  const basicOutput = await vectorStore.similaritySearch(searchTerm, 10);
  // "plant wisdom",
  // "MongoDB Atlas security",
  const basicResults = basicOutput.map((results) => ({
    pageContent: results.pageContent,
    pageNumber: results.metadata?.loc?.pageNumber,
    source: results.metadata.source,
  }));
  console.log("Basic Semantic Search Results:", basicResults.length);
  console.log(basicResults);
}
