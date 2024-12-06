export async function semanticSearchWithPreFilter({
  vectorStore,
  searchTerm,
  preFilter = {},
}) {
  // Semantic search with metadata filter
  const filteredOutput = await vectorStore.similaritySearch(
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
    pageNumber: results.metadata?.loc?.pageNumber,
    source: results.metadata.source,
  }));
  console.log(
    "Semantic Search with Filtering Results:",
    filteredResults.length,
  );
  console.log(filteredResults);
}
