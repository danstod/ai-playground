import { setRequestVariable } from "../services/request-context.service.js";

const readRequestHeaders = (req, res, next) => {
  setRequestVariable("requestId", req.headers["x-request-id"]);
  setRequestVariable("userAgent", req.headers["user-agent"]);
  setRequestVariable("httpMethod", req.method);
  setRequestVariable("uri", req.originalUrl);
  setRequestVariable("remoteIP", req.ip);
  setRequestVariable("trackingId", req.headers["x-guest-id"]);
  next();
};

export default readRequestHeaders;
