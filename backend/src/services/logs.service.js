import { getRequestVariable } from "./request-context.service.js";
import log4js from "log4js";
import jsonLayout from "log4js-json-layout";

const getLogger = (categoryName) => {
  return log4js.getLogger(categoryName);
};

const tokens = {
  requestId: () => getRequestVariable("requestId") || "?",
  guestId: () => getRequestVariable("guestId") || "?",
  processId: () => process.pid,
  tenantId: () => getRequestVariable("tenantId") || "?",
  trackingId: () => getRequestVariable("trackingId") || "?",
  httpMethod: () => getRequestVariable("httpMethod") || "?",
  uri: () => getRequestVariable("uri") || "?",
  path: () => getRequestVariable("path") || "?",
  userId: () => {
    const user = getRequestVariable("user");
    return user?.userId;
  },
  httpStatus: () => getRequestVariable("httpStatus") || "?",
  error: () => getRequestVariable("error") || "",
  stack: () => getRequestVariable("stack") || "",
  responseTime: () => getRequestVariable("responseTime") || "?",
  remoteIP: () => getRequestVariable("remoteIP") || "?",
  userAgent: () => getRequestVariable("userAgent") || "?",
  queueName: () => getRequestVariable("queueName") || "?",
  queueMessageId: () => getRequestVariable("queueMessageId") || "?",
  queueMessageGroupId: () => getRequestVariable("queueMessageGroupId") || "?",
  queueMessageDeduplicationId: () =>
    getRequestVariable("queueMessageDeduplicationId") || "?",
};

const getAppenders = () => {
  return process.env.LOG_JSON
    ? {
        type: "stdout",
        layout: {
          type: "json",
          static: {
            appName: process.env.APP_NAME,
            version: process.env.VERSION,
          },
          dynamic: tokens,
        },
      }
    : {
        type: "stdout",
        layout: {
          type: "pattern",
          pattern:
            "[%d] [%p] [%x{requestId}] [%x{queueName}] [%x{tenantId}] [%x{uri}] [%x{queueMessageGroupId}] %c - %m %x{stack}",
          tokens,
        },
      };
};

log4js.addLayout("json", jsonLayout);
log4js.configure({
  disableClustering: true,
  appenders: {
    out: getAppenders(),
  },
  categories: {
    default: {
      appenders: ["out"],
      level: process.env.LOG_LEVEL || "info",
    },
  },
});

export { getLogger };
