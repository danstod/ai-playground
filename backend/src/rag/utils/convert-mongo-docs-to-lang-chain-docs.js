import { Document } from "langchain/document";

export function convertMongoDocsToLangChainDocs(mongoDocs) {
  const docs = [];
  for (const doc of mongoDocs) {
    const langChainDocument = new Document({
      pageContent: doc.text,
      metadata: {
        source: doc.source,
        pdf: doc.pdf,
        loc: doc.loc,
      },
    });
    docs.push(langChainDocument);
  }

  return docs;
}
