import { Document } from "langchain/document";

class SentenceSectionSplitter {
  constructor(chunkSize = 1000, chunkOverlap = 100) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  splitText(text) {
    // Split text by sentence-ending punctuation (., !, ?)
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [];
    const chunks = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.chunkSize) {
        // Save the current chunk
        chunks.push(currentChunk.trim());
        // Start new chunk with overlap from end of previous chunk
        currentChunk = currentChunk.slice(-this.chunkOverlap) + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    // Push any remaining text as the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  splitDocuments(documents) {
    const splitDocuments = documents.map((doc) => {
      const chunks = this.splitText(doc.pageContent);
      return chunks.map((chunk) => new Document({ pageContent: chunk }));
    });
    return splitDocuments.flat();
  }
}

// Usage example:
// const text =
//   "This is the first sentence. This is the second sentence, which is longer and provides more details. " +
//   "Now, here comes the third sentence! Does this handle questions properly? Let's see if it can split " +
//   "across a paragraph boundary. Indeed, we have several sentences now, and this should be a good test. The aim is to expand the use of the Cuvama app to the marketing, and BDRs teams and create a seamless customer journey focused on customer outcomes and this will improve Zellis’ customer retention and satisfaction, as well as increase revenue and reduce churn.";
//
// const splitter = new SentenceSectionSplitter(100, 10);
// const documents = [{ pageContent: text }];
// const splitDocs = splitter.splitDocuments(documents);
//
// console.log(splitDocs.map((doc) => doc.pageContent));
