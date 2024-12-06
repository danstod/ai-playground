import express from "express";
import asyncHandler from "../utils/async-handler.js";
const healthCheckRouter = new express.Router();

healthCheckRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    return res.status(200).send("OK");
  }),
);

export default healthCheckRouter;
