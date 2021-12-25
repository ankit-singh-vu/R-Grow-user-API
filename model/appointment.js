const mongoose = require("mongoose");
const moment = require("moment");

const appointment = mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Services" },
    retailerId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_retailer" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "rgrow_users" },

    appointment_date: { type: Date ,default:null},
    appointment_start_time: { type: String ,default:null},
    appointment_end_time: { type: String ,default:null},


    amount_to_pay: { type: String },
    amount_paid: { type: String, default: null},
    amount_due: { type: String ,default: null},

    appointment_location: {
      type: String,
      enum: ["shop", "home"],//completed=delivered 
      default: "shop",
    },

    appointment_status: {
      type: String,
      enum: ["failed", "pending", "accepted_by_retailer", "cancelled_by_customer","cancelled_by_retailer","completed"],//completed=delivered 
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

    is_delete: {
      type: Number,
      enum: [0, 1],//1 = deleted, 0 = not deleted
      default: 0,
    },
  },
  { timestamps: true }
);

// Virtual for date generation
appointment.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

// Virtual for date generation
appointment.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model("appointment", appointment);
