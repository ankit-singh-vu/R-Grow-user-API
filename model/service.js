const mongoose = require("mongoose");
const moment = require("moment");

const services = mongoose.Schema(
  {
    description: String,
    // serviceCategory: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Service_category",
    // },
    serviceCategory: { type: String, required: true },
    hourlyRate: { type: String, required: true },
    experience: { type: String, required: true },
    hsnNumber: { type: String, required: true },
    availibility: {
      type: [String],
      enum: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
      require: true,
    },
    timeSlot: { type: String, required: true },
    serviceImages: [
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

module.exports = mongoose.model("Services", services);
