import { Document } from "langchain/document";

export function convertTextToLangChainDoc(text) {
  return new Document({
    pageContent: text,
    metadata: {
      // source: doc.source,
      // pdf: doc.pdf,
      // loc: doc.loc,
    },
  });
}
