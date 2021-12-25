const mongoose = require("mongoose");
const moment = require("moment");

const productCategory = mongoose.Schema(
  {
    // _id: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      require: true,
    },
    // image: {
    //   type: String,
    //   require: true,
    // },
    // cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

// Virtual for date generation
productCategory.virtual("createdOn").get(function () {
  const generateTime = moment(this.createdAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

// Virtual for date generation
productCategory.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

module.exports = mongoose.model("Product_category", productCategory);
