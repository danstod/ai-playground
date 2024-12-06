const flattenMongooseDocument = (document) => {
  return !document
    ? document
    : document.toObject
    ? document.toObject({ virtuals: true })
    : document;
};

export default flattenMongooseDocument;
