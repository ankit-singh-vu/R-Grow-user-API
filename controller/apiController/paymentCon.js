const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const tokens = require("../../config/tokens");
const { admin } = require("../../config/fbConfig");
const Retailer = require("../../model/retailer");
const Transaction = require("../../model/transaction");
const Order = require("../../model/orders");
const Cart = require("../../model/cart");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const moment = require("moment");
const User = require('../../model/users');

const fast2sms = require('fast-two-sms')



let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SCERET,
});

module.exports = {
  
  createOrderRazorpay: async (req, res) => {
    try {
      let {amount,receipt_number}=req.body;
      amount=Number(amount)*100;//converting in paise 
      var options = {
        amount: amount,  // amount in the smallest currency unit(paise)
        currency: "INR",
        receipt: receipt_number
      };
      // var options = {
      //   amount: 50000,  // amount in the smallest currency unit
      //   currency: "INR",
      //   receipt: "order_rcptid_11"
      // };
      instance.orders.create(options, function(err, order) {
        console.log(order);
        if (order) {
          return res.status(200).json({ status: "success", order: order });
        } else {
          throw new Error("Invalid order");
        }
      });
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  savePaymentinfo : async (req, res) => {
    try {
        const { razorpay_payment_id,razorpay_order_id,razorpay_signature } = req.body;
        if( (razorpay_payment_id) && (razorpay_payment_id !== "")){
        // pay_IDYOJlfUMlzJDi
        // order_IDYAINeUagSYhD
        // 66663e6452c3dc0957d00911b846fd8bdd71bccd6eeb8eea1d57e3fbecec6e2          
                const transaction = new Transaction({
                  razorpay_payment_id: razorpay_payment_id,
                  razorpay_order_id: razorpay_order_id,
                  razorpay_signature: razorpay_signature,
                });
                const result1 = await transaction.save();
                let result = result1.toObject();
                // delete result.password;
                console.log(result)

                //delete from cart
                // await User.findByIdAndUpdate(result._id,{
                //     refreshToken: refreshToken,
                //     updatedAt: Date.now()
                // }, {new: true});

                res.status(200).json({ status: 'success', data: result});
           
        }else{
            return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
        }
    } catch (error) {
        res.status(400).json({ status:'error', error: error.message });
    }
  },  

  verifyPayment: async (req, res) => {

    const { razorpay_payment_id,razorpay_order_id,razorpay_signature } = req.body;
    let concat_str=razorpay_order_id + "|" + razorpay_payment_id;
    let expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SCERET)
    .update(concat_str.toString())
    .digest('hex');
    console.log("sig received " ,razorpay_signature);
    console.log("sig generated " ,expectedSignature);

    let result = {"signatureIsValid":"false"}
    if(expectedSignature === razorpay_signature)
    {
      result={"signatureIsValid":"true"}
    }
    res.status(200).json({ status: 'success', data: result});
  },


  createOrder: async (req, res) => {
    try {
      let products=[];
      let data=req.body;
      let p=req.body.products;

      const getTotaldata = await Order.countDocuments({});
      const str = '0';
      const OrderId = 'Order'+moment(new Date()).format("YYMMDD")+str.repeat((8-getTotaldata.toString().length))+(getTotaldata + 1);

      let to_be_delivered_on = new Date(new Date().getTime()+(10*24*60*60*1000));//after 10 days
      let retailerId=p[0].retailerId._id;

      for (let i = 0; i < p.length; i++) {
        const element = p[i];
        // let  = await Product.find({_id:p[i].productId._id})



        let ob={
          product:p[i].productId._id,
          quantity:p[i].quantity,
          selling_price: p[i].selling_price,
          total_selling_price: p[i].total_selling_price,//after multiplying with quantity
          to_be_delivered_on:to_be_delivered_on,
          payment_option:p[i].payment_option,
        }
        products.push(ob)
      }
      // console.log(products)
      const order = new Order({

        orders: products,

        userId:data.userId,
        OrderId:OrderId,
        retailerId:retailerId,

        total_order_cost_price:data.total_order_cost_price,
        total_order_discount_price:data.total_order_discount_price,
        gst:data.gst,

        total_order_selling_price:data.total_order_selling_price,
        amount_to_pay:data.total_order_selling_price,

        payment_option:data.payment_option,
    });


    const result1 = await order.save();
    console.log(result1)
    


      res.status(200).json({ status: 'success', data: result1});
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },  

  
  sendMessage: async (req, res) => {
    try {
      let products="Redmin Note 4 in 2 Quantity \n by customer Ankit Singh,\n ph-70000000"
      let message="You have some new order requests through R-grow website. \n";
      message=message+products;
      let numbers=[]
      numbers.push('7044971068');
      const options = {authorization : process.env.FAST_2_SMS_API_KEY  , sender_id:'R-grow', message : message ,  numbers : numbers} 
      const response = await fast2sms.sendMessage(options) 
      res.status(200).json({ status: 'success', data: response});

    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  }, 

  requestOrderBackendOneRetailer: async (req, res) => {
    try {
        let  filter={}
        let{userId,retailerId,payment_option,selected_address_id}=req.query;

        let message="", messageUser="",messageAmount="",messageProducts="",message_customer="";
        let message_subject="You have some new order requests through R-grow website ";
        // let message2="'Redmin Note 4' in 2 Quantity \n by customer 'Ankit Singh' ,ph-70000000"

        
        let userInfo = await User.findById(userId);
        if(userInfo)
        messageUser=userInfo.name +', phone: ' +userInfo.phone;
        
        let numbers_customer=[]
        numbers_customer.push(userInfo.phone);

        let numbers=[]// phone which will recieve msg 
        let retailerInfo = await Retailer.findById(retailerId);
        if(retailerInfo)
        numbers.push(retailerInfo.phone);

        if(
          !userId || userId == "" ||
          !retailerId || retailerId == "" ||
          !payment_option || payment_option == "" ||
          !selected_address_id || selected_address_id == ""
        ){
          return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
        }


        filter.userId=userId
        filter.is_save_for_later=0
        filter.is_delete=0

        let distinct_retailers=[];
        distinct_retailers.push( retailerId );


        let retailer_wise_items=[]
        let items_count=0;
        let total_amount=0;
        let total_price=0;
        for (let i = 0; i < distinct_retailers.length; i++) {
          let retailer_info=null;
          retailer_info= await Retailer.findById(distinct_retailers[i]).select('retailerName city pincode storeLocation upi_id gPayNo')
          if(!retailer_info){
              return res.status(400).json({ status: "error", error: "retailer not found" });
          }


          filter.retailerId=null
          filter.retailerId=distinct_retailers[i];
          // console.log(filter)
          let x= await Cart.find(filter,null, {sort: {createdAt: -1}})
          .populate("retailerId","retailerName")
          .populate("productId","productName description productImages")
          // console.log(x)


          for (let j = 0; j < x.length; j++) {
              ++items_count;
              total_price=total_price+Number(x[j].total_cost_price);
              total_amount=total_amount+Number(x[j].total_selling_price);
              // x[j].delivered_date=new Date(new Date().getTime()+(7*24*60*60*1000));//7days
          }

          let obj={}
          // obj.retailerId=distinct_retailers[i]
          obj.retailer_info=retailer_info
          obj.delivered_date=new Date(new Date().getTime()+(7*24*60*60*1000));//7days
          obj.items=x
          retailer_wise_items.push( obj );
        }

        let one_retailer_wise_items=retailer_wise_items[0];
        // console.log(retailer_wise_items)
        // let approx_delivered_date = new Date(new Date().getTime()+(7*24*60*60*1000));//after 10 days

        // let reurn_result={
        //   // approx_delivered_date:approx_delivered_date,
        //   items_count:items_count,
        //   total_price:total_price,
        //   total_amount:total_amount,
        //   orders:one_retailer_wise_items
        // }
        //------------------------------------
        let products=[];

        let p=one_retailer_wise_items.items;//////////

        const getTotaldata = await Order.countDocuments();
        const str = '0';
        const OrderId = 'Order'+moment(new Date()).format("YYMMDD")+str.repeat((8-getTotaldata.toString().length))+(getTotaldata + 1);

        let to_be_delivered_on = new Date(new Date().getTime()+(7*24*60*60*1000));//after 7 days
    

        for (let i = 0; i < p.length; i++) {
          messageProducts=messageProducts+p[i].productId.productName+' in '+ p[i].quantity+' Quantity ,\n ';
          let ob={
            product:p[i].productId._id,
            quantity:p[i].quantity,
            selling_price: p[i].selling_price,
            total_selling_price: p[i].total_selling_price,//after multiplying with quantity

            to_be_delivered_on:to_be_delivered_on,
            payment_option:payment_option,
          }
          products.push(ob)
          
        }
        // ------------------------------
        if (products.length === 0) 
        {
          console.log("Array is empty!") 
          return res.status(400).json({ status: "error", error: "No Products in the Cart!" }); 
        }

        const order = new Order({
          orders: products,
          userId:userId,
          OrderId:OrderId,
          retailerId:retailerId,
  
          total_order_cost_price:total_price,
          total_order_discount_price:0,/////--
          gst:0,/////--
  
          total_order_selling_price:total_amount,
          amount_to_pay:total_amount,
  
          payment_option:payment_option,
          selected_address_id:selected_address_id,
        });
  
  

        let delete_condition={}
        delete_condition.userId = userId
        delete_condition.retailerId = retailerId
        delete_condition.is_save_for_later=0
        delete_condition.is_delete=0

        let update_data={}
        update_data.is_delete=1;
        update_data.is_order_placed=1;
        update_data.order_placed_on=Date.now();
        
        const result1 = await order.save();
        await Cart.updateMany(delete_condition, {"$set":update_data},{new: true});

        //send message retailer
        message=
        message_subject
        +' by '+messageUser
        +' of total amount Rs. '+total_amount+' by '+payment_option
        +'.\n Ordered Items include :\n '+messageProducts
        ;

        //send message customer
        message_customer=
        'You requested some orders on R-grow Website'
        +' from '+retailerInfo.retailerName
        +' of total amount Rs. '+total_amount+' by '+payment_option
        +'. You can pay to the retailer UPI Id '+retailerInfo.upi_id 
        +'. COD is also available.'
        +'.Retailer Phone no.- '+retailerInfo.phone
        +'.\n Ordered Items include :\n '+messageProducts
        ;        

        // console.log(message)
        // console.log(numbers)

        // console.log(message_customer)
        // console.log(numbers_customer)

        let message_to_retailer = await sendMessage (message, numbers);
        let message_to_customer = await sendMessage (message_customer, numbers_customer);


        // res.status(200).json({ status: 'success', data: p, message_result: "message_result", message:message});
        res.status(200).json({ status: 'success',
          data: result1,
          message_to_retailer: message_to_retailer,
          message_to_customer: message_to_customer
        });
        // console.log(result1)

      // res.status(200).json({ status: 'success', data: "result1", message_result: "message_result"});

    } catch (error) {
      return res.status(400).json({ status: "error", error: error.message });
    }
  },  

  // checkoutOneRetailer: async (req, res) => {
  //   try {
  //     let products=[];
  //     let data=req.body;

      
  //     let p=req.body.products;//////////

  //       const getTotaldata = await Order.countDocuments({});
  //       const str = '0';
  //       const OrderId = 'Order'+moment(new Date()).format("YYMMDD")+str.repeat((8-getTotaldata.toString().length))+(getTotaldata + 1);

  //       let to_be_delivered_on = new Date(new Date().getTime()+(7*24*60*60*1000));//after 7 days
  //       let retailerId=p[0].retailerId._id;////////////

  //     for (let i = 0; i < p.length; i++) {
  //       const element = p[i];
  //       // let  = await Product.find({_id:p[i].productId._id})



  //       let ob={
  //         product:p[i].productId._id,
  //         quantity:p[i].quantity,
  //         selling_price: p[i].selling_price,
  //         total_selling_price: p[i].total_selling_price,//after multiplying with quantity
  //         to_be_delivered_on:to_be_delivered_on,
  //         payment_option:p[i].payment_option,
  //       }
  //       products.push(ob)
  //     }
  //     // console.log(products)
  //     const order = new Order({

  //       orders: products,

  //       userId:data.userId,////////
  //       OrderId:OrderId,
  //       retailerId:retailerId,

  //       total_order_cost_price:data.total_order_cost_price,/////
  //       total_order_discount_price:data.total_order_discount_price,/////
  //       gst:data.gst,/////

  //       total_order_selling_price:data.total_order_selling_price,////
  //       amount_to_pay:data.total_order_selling_price,///////

  //       payment_option:data.payment_option,
  //     });


  //     // const result1 = await order.save();
  //     // console.log(result1)
    


  //     res.status(200).json({ status: 'success', data: order});
  //     // res.status(200).json({ status: 'success', data: result1});
  //   } catch (error) {
  //     res.status(400).json({ status: "error", error: error.message });
  //   }
  // },   

  createOrderBackend: async (req, res) => {
    try {

      let retailerproducts;
      let  filter={}
      // let query=req.query;
      // console.log(query)

      filter.userId=req.body.userId;
      filter.is_save_for_later=0
      filter.is_delete=0

      retailerproducts = await Cart.find(filter,null, {sort: {createdAt: -1}})
      .populate("retailerId","retailerName")
      .populate("productId","productName description productImages")      
      if(retailerproducts.length==0){
        return res.status(400).json({ status: 'error', error: 'Sorry! No Products in your cart.' });
      }


    let retailerproducts_arr=[];

      for (let i = 0; i < retailerproducts.length; i++) {   
        retailerproducts_arr.push(retailerproducts[i].retailerId);

        // if(retailerproducts[i].retailerId==null){
        //   return res.status(400).json({ status: 'error', error: 'The retailer associated with the product  '+retailerproducts[i].productId.productName+' is not found' });
        // }
      }


      let is_same_retailer=false;
      is_same_retailer=retailerproducts_arr.every( (val, i, arr) => val === arr[0] )  
      // if(!is_same_retailer){
      //   return res.status(400).json({ status: 'error', error: 'You can not choose products from different retailers in same order. You can move products from other retailers to save for later for now .' });
      // }
      console.log(retailerproducts)
      console.log(retailerproducts_arr)
    //   let products=[];
    //   let data=req.body;
    //   let p=req.body.products;

    //   const getTotaldata = await Order.countDocuments({});
    //   const str = '0';
    //   const OrderId = 'Order'+moment(new Date()).format("YYMMDD")+str.repeat((8-getTotaldata.toString().length))+(getTotaldata + 1);

    //   let to_be_delivered_on = new Date(new Date().getTime()+(10*24*60*60*1000));//after 10 days
    //   let retailerId=p[0].retailerId._id;

    //   for (let i = 0; i < p.length; i++) {
    //     const element = p[i];
    //     // let  = await Product.find({_id:p[i].productId._id})



    //     let ob={
    //       product:p[i].productId._id,
    //       quantity:p[i].quantity,
    //       selling_price: p[i].selling_price,
    //       total_selling_price: p[i].total_selling_price,//after multiplying with quantity
    //       to_be_delivered_on:to_be_delivered_on,
    //       payment_option:p[i].payment_option,
    //     }
    //     products.push(ob)
    //   }
    //   // console.log(products)
    //   const order = new Order({

    //     orders: products,

    //     userId:data.userId,
    //     OrderId:OrderId,
    //     retailerId:retailerId,

    //     total_order_cost_price:data.total_order_cost_price,
    //     total_order_discount_price:data.total_order_discount_price,
    //     gst:data.gst,

    //     total_order_selling_price:data.total_order_selling_price,
    //     amount_to_pay:data.total_order_selling_price,

    //     payment_option:data.payment_option,
    // });


    // const result1 = await order.save();
    // console.log(result1)
    
    // await Cart.updateMany(
    //   filter,
    //   {
    //     $set: {
    //       is_delete: 1,
    //     }
    //   }
    // )

      // res.status(200).json({ status: 'success', data: retailerproducts});
      res.status(200).json({ status: 'success', data: is_same_retailer});
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },  

};


async function fileUpload(requestFile,fileName,allowType){
  try {
      return new Promise(function(resolve, reject) {
          const uploadedFile = requestFile;
          if(allowType.includes(uploadedFile.mimetype)) {
              let uploadedFileName = uploadedFile.name;
              const filenameSplit = uploadedFileName.split('.');
              const fileExtension = filenameSplit[filenameSplit.length-1];
              uploadedFileName = fileName.toLowerCase().replace(" ", "-") +'-'+ Date.now()+ '.' + fileExtension;
              fs.readFile(uploadedFile.tempFilePath, (err, uploadedData) => {
                  const params = {
                      Bucket: process.env.BUCKET_NAME,
                      Key: "images/"+ uploadedFileName, // File name you want to save as in S3
                      Body: uploadedData 
                  };
                  s3.upload(params, async (err, data) => {
                      if (err) {
                          return reject("Sorry! File upload failed. " + err.message);
                      }else{
                          resolve(data.Key);
                      }
                  });
              });
          }else{
              return reject("Sorry! Invalid File.");
          }
      });
  } catch (error) {
      return reject(error.message);
  }
}

async function sendMessage (message, numbers){
  const options = {authorization : process.env.FAST_2_SMS_API_KEY  , sender_id:'R-grow', message : message ,  numbers : numbers} 
  const response = await fast2sms.sendMessage(options) 
  return response;
};