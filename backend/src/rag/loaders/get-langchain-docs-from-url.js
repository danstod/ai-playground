import "@mendable/firecrawl-js";
import { FireCrawlLoader } from "@langchain/community/document_loaders/web/firecrawl";

export const getLangChainDocsFromUrl = async ({ url, dataCleaner }) => {
  const loader = new FireCrawlLoader({
    url,
    // apiKey: "...", // Optional, defaults to `FIRECRAWL_API_KEY` in your env.
    mode: "scrape", // The mode to run the crawler in. Can be "scrape" for single urls or "crawl" for all accessible subpages
    params: {
      // optional parameters based on Firecrawl API docs
      // For API documentation, visit https://docs.firecrawl.dev
    },
    format: "markdown", // The format of the loaded documents. Can be "json" or "text"
  });

  let docs = await loader.load();

  if(dataCleaner) {
    docs = dataCleaner(docs);
  }


  return docs;
};
