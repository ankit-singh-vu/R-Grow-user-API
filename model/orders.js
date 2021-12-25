const mongoose = require("mongoose");
const moment = require("moment");

const orders = mongoose.Schema(
  {
    orders: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        // cost_price: { type: String },
        selling_price: { type: String },
        // total_cost_price: { type: String },//after multiplying with quantity
        total_selling_price: { type: String },//after multiplying with quantity
        to_be_delivered_on:{ type: Date ,default:null},
        delivered_at:{ type: Date ,default:null},
        order_status: {
          type: String,
          enum: ["failed", "pending", "accepted_by_retailer", "cancelled_by_customer","cancelled_by_retailer","restitute","completed","returned","on_the_way"],//completed=delivered 
          default: "pending",
        },
        payment_option: {
          type: String,
          enum: ["COD", "Online",], 
          default: "Online",//change afterwards
        },
        
        marked_as_paid: {
          type: String,
          enum: ["Yes", "No","Partially"], 
          default: "No",
        },        
        paid_at:{ type: Date ,default:null},

      },
    ],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_users" }, //customer
    selected_address_id: { type: String,default :null }, 
    OrderId:{ type: String, required: true },
    retailerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "rgrow_retailer"
    },
    total_order_cost_price: { type: String },//adding all products in the order
    total_order_discount_price: { type: String },
    gst: { type: String },

    total_order_selling_price: { type: String },
    amount_to_pay: { type: String },//same as total_order_selling_price
    amount_paid: { type: String, default: null},
    amount_due: { type: String ,default: null},

    order_status: {
      type: String,
      enum: ["failed", "pending", "accepted_by_retailer", "cancelled_by_customer","cancelled_by_retailer","restitute","completed"],//completed=delivered 
      default: "pending",
    },

    payment_option: {
      type: String,
      enum: ["COD", "Online",], 
      default: "Online",//change afterwards
    },
    
    marked_as_paid: {
      type: String,
      enum: ["Yes", "No","Partially"], 
      default: "No",
    },
    paid_at:{ type: Date ,default:null},


  },
  { timestamps: true }
);

// Virtual for date generation
orders.virtual("createdOn").get(function () {
  const generateTime = moment(this.createdAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

// Virtual for date generation
orders.virtual("updatedOn").get(function () {
  const generateTime = moment(this.updatedAt).format("DD-MM-YYYY h:m:ss A");
  return generateTime;
});

module.exports = mongoose.model("Orders", orders);