const mongoose = require("mongoose");
const moment = require("moment");

const rating = mongoose.Schema(
  {
    rate: { type: String, required: true },
    review: { type: String ,default: null}, //message
    
    reviewOfId: { type: String, required: true },//can be product id /service id/ retailer id
    reviewOftype: {
      type: String,
      enum: ["product", "service","retailer","customer"], 
      default: null,
    },

    reviewbyId: { type: String, required: true },//one who added this review 
    reviewBytype: {
      type: String,
      enum: ["retailer","customer"], 
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

rating.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});
module.exports = mongoose.model("rating", rating);
