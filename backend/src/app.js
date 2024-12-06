import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import corsOptions from "./middleware/cors-options.js";
import mongoose from "mongoose";
import healthCheckRouter from "./routers/health-check.router.js";
import companiesRouter from "./routers/companies.router.js";
import startRequestContext from "./middleware/start-request-context.js";
import logRequests from "./middleware/log-requests.js";
import readRequestHeaders from "./middleware/read-request-headers.js";
import aiRouter from "./routers/ai.router.js";

/*
const asyncHandler = require("./utils/async-handler");

const {
  initializeRequestContext,
  readRequestHeaders,
  validateRequestStructure,
  validateTenantIdHeader,
  validateAuthorizationHeader,
  logRequests,
  errorHandler,
  clearCaches,
} = require("./middleware");
const corsOptions = require("./middleware/cors-options");
const securityHeaders = require("./middleware/security-headers");
*/

const app = express();
app.enable("trust proxy");
app.disable("x-powered-by");
app.use(bodyParser.json());
app.use(express.json());
app.use(startRequestContext);
app.use(readRequestHeaders);
app.use(logRequests);
app.use(cors(corsOptions));
//app.use(readRequestHeaders);
//app.use(securityHeaders);
//app.use(validateRequestStructure);
//app.use(asyncHandler(validateTenantIdHeader));
//app.use(validateAuthorizationHeader);
//app.use(clearCaches);

app.use("/healthcheck", healthCheckRouter);
app.use("/companies", companiesRouter);
app.use("/ai", aiRouter);

app.get("*", function (req, res) {
  res.status(404);

  console.log("Test");

  // respond with json
  if (req.accepts("json")) {
    res.json({ error: "Not found" });
    return;
  }

  // default to plain-text. send()
  res.type("txt").send("Not found");
});

//app.use(errorHandler);

await mongoose.connect(process.env.ATLAS_CONNECTION_STRING);

export default app;
