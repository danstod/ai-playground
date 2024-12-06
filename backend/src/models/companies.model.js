import mongoose, { Schema } from "mongoose";

const companiesSchema = new Schema(
  {
    source: String,
    companyName: String,
    companySize: String,
    industry: String,
    bve: Boolean,
  },
  { autoCreate: false, autoIndex: false },
);

export default mongoose.model("companies", companiesSchema);
