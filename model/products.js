const mongoose = require("mongoose");
const moment = require("moment");

const products = mongoose.Schema(
  {
    productName: { type: String, required: true },
    description: String,
    // productCategory: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Product_category",
    // },
    productCategory: { type: String, required: true },
    hsnNumber: { type: String, required: true },
    price: { type: String, required: true },
    quantity: { type: String, required: true },
    defective_product_count: { type: Number, default:0 },

    gstValue: {
      type: String,
      enum: ["NIL"],
      default: "NIL",
    },
    totalTaxableAmount: { type: String, required: true },
    totalAmount: { type: String, required: true },
    productImages: [
      {
        name: String,
        image: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_retailer" },
    rating_avg:{ type: String, default:  "0"},
    reviews_count:{ type: Number, default:  0},
    status: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
  },
  { timestamps: true }
);

// // Virtual for date generation
// car.virtual('createdOn').get(function () {
//     const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
//     return generateTime;
// });

// // Virtual for date generation
// car.virtual('updatedOn').get(function () {
//     const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
//     return generateTime;
// });

module.exports = mongoose.model("Products", products);
