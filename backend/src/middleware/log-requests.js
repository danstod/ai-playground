import { getLogger } from "../services/logs.service.js";
import {
  getRequestVariable,
  setRequestVariable,
} from "../services/request-context.service.js";
import onFinished from "on-finished";

const logger = getLogger("log-request");

const startRequest = () => {
  setRequestVariable("startAt", process.hrtime());
  logger.info("Request started");
};

const finishRequest = (err, res) => {
  const startAt = getRequestVariable("startAt");
  const elapsed = startAt ? process.hrtime(startAt) : null;
  const ms = elapsed ? elapsed[0] * 1e3 + elapsed[1] * 1e-6 : "?";
  const statusCode = res.statusCode;

  setRequestVariable("httpStatus", statusCode);
  setRequestVariable("responseTime", ms);

  if (statusCode < 400) {
    logger.info(`Request completed in ${Math.round(ms)}ms`);
  } else {
    const error = getRequestVariable("error") || "?";
    const stack = getRequestVariable("stack") || "?";
    logger.error(
      `Request failed in ${Math.ceil(ms)}ms${
        process.env.LOG_JSON ? "" : " " + error + " " + stack
      }`,
    );
  }
};

const logRequests = (req, res, next) => {
  startRequest(res, req);
  onFinished(res, finishRequest);
  next();
};

export default logRequests;
