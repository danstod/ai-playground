export async function maxMarginalRelevanceSearch({ vectorStore, searchTerm }) {
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
    pageNumber: results.metadata?.loc?.pageNumber,
    // source: results.metadata.source,
    source: results.metadata?.url,
  }));
  console.log("Max Marginal Relevance Search Results:", mmrResults.length);
  console.log(mmrResults);
}
