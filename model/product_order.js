const mongoose = require("mongoose");
const moment = require("moment");

const product_order = mongoose.Schema(
  {
    // generated_Order_number:{ type: Number, required: true },
    
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_retailer" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_users" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Orders" },
   
    quantity: { type: Number, required: true },
    cost_price: { type: String },
    selling_price: { type: String },
    // offer_percent: { type: String },
    // offer_applied: { type: String },
    total_cost_price: { type: String },//after multiplying with quantity
    total_selling_price: { type: String },//after multiplying with quantity
  },

  { timestamps: true }
);

// Virtual for date generation
product_order.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
product_order.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model("product_order", product_order);