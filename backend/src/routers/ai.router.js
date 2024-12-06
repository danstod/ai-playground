import asyncHandler from "../utils/async-handler.js";
import express from "express";
import generateValueStory from "../services/value-stories/generate-value-story.js";
import generateValueStoryWithFullPrompt from "../services/value-stories/generate-value-story-full-prompt.js";
import { getPerplexityAIResponse } from "../services/perplexityai.service.js";
const aiRouter = new express.Router();
const useFullPrompt = false;

const generateValueStoryEndpoint = async (req, res) => {
  if (useFullPrompt) {
    return res
      .status(200)
      .send(await generateValueStoryWithFullPrompt(req.body));
  }

  return res.status(200).send(await generateValueStory(req.body));
};

const generatePerplexityEndpoint = async (req, res) => {
  return res.status(200).send(await getPerplexityAIResponse(req.body));
};

aiRouter.post(
  "/generate-value-story",
  asyncHandler(generateValueStoryEndpoint),
);
aiRouter.post("/generate-perplexity", asyncHandler(generatePerplexityEndpoint));

export default aiRouter;
