import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";

// Define a custom retriever class that extends ScoreThresholdRetriever
class ScoreThresholdRetrieverWithScores extends ScoreThresholdRetriever {
  async getRelevantDocumentsWithScores(query) {
    // Use similaritySearchWithScore to get both documents and scores
    // console.log('THIS', this);
    const results = await this.vectorStore.similaritySearchWithScore(
      query,
      this.maxK,
    );

    // Map the results to an array of objects with document and score properties
    return results.map(([document, score]) => {
      // console.log("ScoreThresholdRetrieverWithScores", score);
      return {
        ...document,
        score,
      };
    });
  }
}

export async function scoreThresholdRetriever({
  vectorStore,
  searchTerm,
  maxK,
  minSimilarityScore,
}) {
  const options = {
    minSimilarityScore: minSimilarityScore || 0.02, // Finds results with at least this similarity score
    maxK: maxK || 3, // The maximum K value to use. Use it based to your chunk size to make sure you don't run out of tokens
    kIncrement: 2, // How much to increase K by each time. It'll fetch N results, then N + kIncrement, then N + kIncrement * 2, etc.
  };

  // const similaritySearchWithScoreResults =
  //   await vectorStore.similaritySearchWithScore("biology", 2, filter);

  // const retriever = ScoreThresholdRetrieverWithScores.fromVectorStore(
  //     vectorStore,
  //     options,
  // );
  const retriever = ScoreThresholdRetriever.fromVectorStore(
    vectorStore,
    options,
  );

  // const results = await retriever.getRelevantDocumentsWithScores(searchTerm);
  const results = await retriever.invoke(searchTerm);
  const basicResults = results.map((results) => ({
    pageContent: results.pageContent,
    source: results.metadata?.sourceName,
    // score: results.score,
  }));

  for (const result of basicResults) {
    console.log(`${result.pageContent} [Source: ${result.source}]`);
  }
  // console.log(
  //   "scoreThresholdRetriever with options: ",
  //   options,
  //   basicResults.length,
  // );
  // console.log(basicResults);
}

export async function getScoreThresholdRetrieverDocuments({
  vectorStore,
  searchTerm,
  maxK,
  minSimilarityScore,
  kIncrement,
}) {
  const options = {
    minSimilarityScore: minSimilarityScore || 0.02, // Finds results with at least this similarity score
    maxK: maxK || 3, // The maximum K value to use. Use it based to your chunk size to make sure you don't run out of tokens
    kIncrement: kIncrement || 2, // How much to increase K by each time. It'll fetch N results, then N + kIncrement, then N + kIncrement * 2, etc.
  };

  const retriever = ScoreThresholdRetriever.fromVectorStore(
    vectorStore,
    options,
  );
  return await retriever.invoke(searchTerm);
}
