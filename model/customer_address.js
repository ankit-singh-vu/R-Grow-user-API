const mongoose = require("mongoose");
const moment = require("moment");

const customer_address = mongoose.Schema(
  {
    CustomerId: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },

    
    // Location: {
    //   type: {
    //     type: String,
    //   },
    //   coordinates: [],
    // },


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
// customer_address.index({ storeLocation: "2dsphere" });
customer_address.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

module.exports = mongoose.model("customer_address", customer_address);
