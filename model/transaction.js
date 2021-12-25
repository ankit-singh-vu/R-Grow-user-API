const mongoose = require("mongoose");
const moment = require("moment");

const transaction = mongoose.Schema(
  {
    
    razorpay_payment_id: { type: String, required: true },
    razorpay_order_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },
    

  //   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
  //   retailerId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_retailer" },
  //   userId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_users" },//customer

  //   quantity: { type: Number, required: true },
  //   cost_price: { type: String },
  //   selling_price: { type: String },
  //   offer_percent: { type: String },
  //   // offer_applied: { type: String },
  //   total_cost_price: { type: String },
  //   total_selling_price: { type: String },

  //   is_delete: {
  //     type: Number,
  //     enum: [0, 1],//1 = deleted, 0 = not deleted
  //     default: 0,
  //   },
  //   is_save_for_later: {
  //     type: Number,
  //     enum: [0, 1],//1 = true, 0 = false
  //     default: 0,
  //   },

  },
  { timestamps: true }
);

// Virtual for date generation
transaction.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
transaction.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model("transaction", transaction);
