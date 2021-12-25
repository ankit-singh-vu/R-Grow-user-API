const AWS = require("aws-sdk");
// const Driver = require("../../model/drivers");
const Retailer = require("../../model/retailer");
const Product = require("../../model/products");
const Service = require("../../model/service");
const Orders = require("../../model/orders");
const mongoose = require("mongoose");
const moment = require("moment");

const fs = require("fs");

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});
module.exports = {
  genStats: async (req, res) => {
    try {
      const { retailer_id } = req.body;
      var now = new Date();

      let retailersOrder = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);
      let retailersOrderLastDay = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            createdAt: {
              $gte: moment().day(-1).toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);
      // console.log(
      //   retailersOrderLastDay.length ? retailersOrderLastDay[0].orderCount : "0"
      // );

      // console.log(moment().startOf("week").toDate());
      let retailersOrderLastWeek = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            createdAt: {
              $gte: moment().day(-7).toDate(),
              $lt: moment().startOf("week").toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);

      let retailersOrderYearly = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            createdAt: {
              $gte: moment().day(-365).toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);

      let retailersSuccessOrder = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            order_status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);
      let retailersSuccessOrderLastDay = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            order_status: "completed",
            createdAt: {
              $gte: moment().day(-1).toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);
      // console.log(retailersSuccessOrderLastDay);

      let retailersSuccessOrderLastWeek = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            order_status: "completed",
            createdAt: {
              $gte: moment().day(-7).toDate(),
              $lt: moment().startOf("week").toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);

      let retailersSuccessOrderLastYear = await Orders.aggregate([
        {
          $match: {
            retailerId: new mongoose.Types.ObjectId(retailer_id),
            order_status: "completed",
            createdAt: {
              $gte: moment().day(-365).toDate(),
            },
          },
        },
        {
          $group: {
            _id: null,
            total_order_selling: {
              $sum: { $toInt: "$total_order_selling_price" },
            },
            orderCount: {
              $sum: 1,
            },
            total_order_cost: {
              $sum: { $toInt: "$total_order_cost_price" },
            },
          },
        },
        // {{ retailerId: retailer_id }, { order_status: "completed" }}
      ]);
      // console.log(retailersOrder);
      // console.log(retailersOrderLastWeek);
      // console.log(retailersOrderLastWeek);
      // console.log(retailersOrderYearly);
      // console.log(retailersSuccessOrder);
      // console.log(retailersSuccessOrderLastDay);
      console.log(retailersOrder.length ? retailersOrder[0].orderCount : 0);

      const data = {
        totalOrderReceipts: retailersOrder.length
          ? retailersOrder[0].orderCount
          : 0,
        total_order_selling: retailersOrder.length
          ? retailersOrder[0].total_order_selling
          : 0,
        total_order_cost: retailersOrder.length
          ? retailersOrder[0].total_order_cost
          : 0,

        totalOrderReceiptsToday: retailersOrderLastDay.length
          ? retailersOrderLastDay[0].orderCount
          : 0,
        total_order_selling_today: retailersOrderLastDay.length
          ? retailersOrderLastDay[0].total_order_selling
          : 0,
        total_order_cost_today: retailersOrderLastDay.length
          ? retailersOrderLastDay[0].total_order_cost
          : 0,

        totalOrderReceiptsWeekly: retailersOrderLastWeek.length
          ? retailersOrderLastWeek[0].orderCount
          : 0,
        total_order_selling_weekly: retailersOrderLastWeek.length
          ? retailersOrderLastWeek[0].total_order_selling
          : 0,
        total_order_cost_weekly: retailersOrderLastWeek.length
          ? retailersOrderLastWeek[0].total_order_cost
          : 0,

        totalOrderReceiptsYearly: retailersOrderYearly.length
          ? retailersOrderYearly[0].orderCount
          : 0,
        total_order_selling_yearly: retailersOrderYearly.length
          ? retailersOrderYearly[0].total_order_selling
          : 0,
        total_order_cost_yearly: retailersOrderYearly.length
          ? retailersOrderYearly[0].total_order_cost
          : 0,

        totalCompletedOrders: retailersSuccessOrder.length
          ? retailersSuccessOrder[0].orderCount
          : 0,
        total_order_selling_completed: retailersSuccessOrder.length
          ? retailersSuccessOrder[0].total_order_selling
          : 0,
        total_order_cost_completed: retailersSuccessOrder.length
          ? retailersSuccessOrder[0].total_order_cost
          : 0,
        total_order_selling_completed_yearly:
          retailersSuccessOrderLastYear.length
            ? retailersSuccessOrderLastYear[0].total_order_selling
            : 0,
        total_order_count_completed_yearly: retailersSuccessOrderLastYear.length
          ? retailersSuccessOrderLastYear[0].orderCount
          : 0,
        total_order_cost_completed_yearly: retailersSuccessOrderLastYear.length
          ? retailersSuccessOrderLastYear[0].total_order_cost
          : 0,

        total_order_selling_completed_weekly:
          retailersSuccessOrderLastWeek.length
            ? retailersSuccessOrderLastWeek[0].total_order_selling
            : 0,
        total_order_count_completed_weekly: retailersSuccessOrderLastWeek.length
          ? retailersSuccessOrderLastWeek[0].orderCount
          : 0,
        total_order_cost_completed_weekly: retailersSuccessOrderLastWeek.length
          ? retailersSuccessOrderLastWeek[0].total_order_cost
          : 0,

        total_order_selling_completed_today: retailersSuccessOrderLastDay.length
          ? retailersSuccessOrderLastDay[0].total_order_selling
          : 0,
        total_order_count_completed_today: retailersSuccessOrderLastDay.length
          ? retailersSuccessOrderLastDay[0].orderCount
          : 0,
        total_order_cost_completed_today: retailersSuccessOrderLastDay.length
          ? retailersSuccessOrderLastDay[0].total_order_cost
          : 0,
        grossProfit: retailersSuccessOrder.length
          ? retailersSuccessOrder[0].total_order_selling
          : 0 - retailersSuccessOrder.length
          ? retailersSuccessOrder[0].total_order_cost
          : 0,
        netProfit: retailersSuccessOrder
          ? retailersSuccessOrder[0].total_order_selling
          : 0 - retailersSuccessOrder
          ? retailersSuccessOrder[0].total_order_cost
          : 0,
      };
      if (retailersOrder.length === 0) {
        res.status(200).json({
          status: "success",
          message: "No Orders Found",
        });
      } else {
        res.status(200).json({ status: "success", data: data });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },
};
