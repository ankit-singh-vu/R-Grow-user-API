const mongoose = require("mongoose");
const moment = require("moment");

const retailer = mongoose.Schema(
  {
    retailerName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Products" }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Services" }],

    website: String,
    profilePic: String,
    gstnNumber: String,

    storeLocation:{
      type:{
          type:String,
      },
      coordinates: [],
    },
    upi_id: { type: String, default: null },
    gPayNo: { type: String, default: null },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    rating_avg:{ type: String, default:  "0"},
    reviews_count:{ type: Number, default:  0},
  },
  { versionKey: false }
);

retailer.index({storeLocation:"2dsphere"});
retailer.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});
module.exports = mongoose.model("rgrow_retailer", retailer);
