import { startRequest } from "../services/request-context.service.js";

const startRequestContext = (req, res, next) => {
  startRequest(() => {
    next();
  });
};

export default startRequestContext;
