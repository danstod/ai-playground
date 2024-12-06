import asyncHandler from "../utils/async-handler.js";
import CompaniesModel from "../models/companies.model.js";
import flattenMongooseDocument from "../utils/flatten-mongoose-document.js";
import express from "express";
const companiesRouter = new express.Router();

const getCompaniesEndpoint = async (req, res) => {
  const companies = await CompaniesModel.find({});

  return res.status(200).send(companies.map(flattenMongooseDocument));
};

companiesRouter.get("/", asyncHandler(getCompaniesEndpoint));

export default companiesRouter;
