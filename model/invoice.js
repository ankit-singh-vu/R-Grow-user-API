const mongoose = require("mongoose");
const moment = require("moment");

const invoice = mongoose.Schema(
  {
    invoice_number: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Orders" },
    orderIdForInv: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_users" }, //customer
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_retailer" },
    invoice_date: { type: String, required: true },
    product_price: { type: String, required: true },
    discount: { type: String },
    discounted_price: { type: String },
    cgst: { type: String, required: true },
    sgst: { type: String, required: true },
    igst: { type: String, required: true },
    customer_name: { type: String, required: true },
    customer_address: { type: String },
    customer_phoneNo: { type: String, required: true },
    customer_email: { type: String, required: true },
    total_amount: { type: String, required: true },
    payment_option: {
      type: String,
      required: true, //change afterwards
    },
  },
  { timestamps: true }
);

// Virtual for date generation
invoice.virtual("createdOn").get(function () {
  const generateTime = moment(this.createdAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

// Virtual for date generation
invoice.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

module.exports = mongoose.model("Invoice", invoice);
