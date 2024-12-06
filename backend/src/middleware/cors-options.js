const corsOptions = {
  origin: (origin, callback) => {
    const origins = [];
    const matches = origin
      ? origin.match(/^http[s]?:\/\/(.*?)(:\d+)?$/)
      : undefined;

    if (
      matches &&
      (matches[1].match(/^.*localhost$/) ||
        matches[1].match(/^.*mac$/) ||
        matches[1].match(/^.*\.cuvama\.com$/))
    ) {
      origins.push(origin);
    }

    callback(null, origins);
  }
};

export default corsOptions;
