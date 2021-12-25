const AWS = require('aws-sdk');
const { admin } = require('../../config/fbConfig');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const tokens = require('../../config/tokens');
const User = require('../../model/users');

const Retailer = require("../../model/retailer");
const Product = require("../../model/products");
const Service = require("../../model/service");
const Cart = require("../../model/cart");
const Order = require("../../model/orders");
const Rating = require("../../model/rating");
const Address = require("../../model/customer_address");
const Invoice = require("../../model/invoice");

const ProductCategory = require("../../model/productCategory");
const pdfService = require('../../service/pdf-service');

const Appointment = require("../../model/appointment");
const fast2sms = require('fast-two-sms')

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});
module.exports = {

    getAppointments: async (req, res) => {
        try {
            let retailerservices;
            let  filter={}
            let query=req.query;
            console.log(query)

            filter.userId=query.userId
            // filter.is_save_for_later=query.is_save_for_later
            filter.is_delete=0

            retailerservices = await Appointment.find(filter,null, {sort: {createdAt: -1}})
            .populate("retailerId","retailerName")
            .populate("serviceId")



            for (let i = 0; i < retailerservices.length; i++) {
                //products images
                for (let j = 0; j < retailerservices[i].serviceId.serviceImages.length; j++) {
                    retailerservices[i].serviceId.serviceImages[j].image = await getSignedUrl(
                      retailerservices[i].serviceId.serviceImages[j].image
                    );
                }                
            }
    
            return res
              .status(200)
              .json({ status: "success", items_returned:retailerservices.length, data: retailerservices });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },    

    addAppointments : async (req, res) => {
        try {
            const {
                serviceId,
                userId,
                appointment_date,
                appointment_start_time,
                appointment_end_time,
                payment_option
            } = req.body;
            
            
            let ap = new Date(appointment_date);
            console.log(ap);


            if( (serviceId) && (serviceId !== "") && (userId) && (userId !== "")){
                
                let previous_appointment = await Appointment.find({ userId: userId});

                let f=0;//0=no overlap
                for (let i = 0; i < previous_appointment.length; i++) {
                    // console.log(previous_appointment[i].appointment_date.getTime());
                    if(ap.getTime() === previous_appointment[i].appointment_date.getTime()){
                        // console.log("true");
                        f=1;
                    }
                    else{
                        // console.log("false");
                    }
                }

                if(f==1) {
                    return res.status(400).json({ status: 'error', error: 'You already have booked some service in this date . Please try again by changing date.' });
                    // return res.status(400).json({ status: 'error', error: 'You already have booked some service in this time period . Please try again by changing date or time.' });
                }
                
                
                let service = await Service.findOne({ _id: serviceId});
                    const appointment = new Appointment({
                        serviceId,
                        retailerId:service.retailerId,
                        userId,
                        // appointment_date:Date.now(),
                        appointment_date:appointment_date,
                        appointment_start_time:appointment_start_time,
                        appointment_end_time:appointment_end_time,
                        amount_to_pay:service.hourlyRate,

                        // appointment_date:appointment_date,
                        // appointment_start_time,
                        // appointment_end_time,
                    });
                    const result = await appointment.save();

                    let message="", messageUser="",message_customer="";


                    let userInfo = await User.findById(userId);
                    if(userInfo)
                    messageUser=userInfo.name +',phone:' +userInfo.phone;
                    
                    let numbers_customer=[]
                    numbers_customer.push(userInfo.phone);

                    let numbers=[]// phone which will recieve msg 
                    let retailerInfo = await Retailer.findById(service.retailerId);
                    if(retailerInfo)
                    numbers.push(retailerInfo.phone);
                    let total_amount=service.hourlyRate;
                    //send message retailer
                    message=
                    'New Appointment request of '
                    +service.description
                    // +' Service through R-grow website '
                    +' by '+messageUser
                    +' of Rs. '+total_amount+' by '+payment_option
                    ;

                    //send message customer
                    message_customer=
                    'UPI Id:'+retailerInfo.upi_id 
                    // +'. COD is also available.'
                    +',Phone:'+retailerInfo.phone
                    +'. You requested an Appointment of '
                    +service.description
                    // +' Service on R-grow Website  from '+retailerInfo.retailerName
                    +' of Rs. '+total_amount+' by '+payment_option

                    ;        

                    console.log(message)
                    console.log(numbers)

                    console.log(message_customer)
                    console.log(numbers_customer)

                    let message_to_retailer = await sendMessage (message, numbers);
                    let message_to_customer = await sendMessage (message_customer, numbers_customer);


                    return res.status(200).json({
                        status: 'success',
                        data: result,
                        message_to_retailer: message_to_retailer,
                        message_to_customer: message_to_customer
                    });
                
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            return res.status(400).json({ status:'error', error: error.message });
        }
    },     
}



async function getSignedUrl(keyName){
    try {
        const s3 = new AWS.S3({
            signatureVersion: 'v4',
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY
        });
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: keyName
        };
        
        const headCode = await s3.headObject(params).promise();
        if(headCode){
            const signedUrl = s3.getSignedUrl('getObject', params);
            return signedUrl;
        }else{
            throw new Error('Sorry! File not found 1')
            
        }
    } catch (error) {
        if (error.code === 'NotFound' || error.code === 'Forbidden') {
            // throw new Error('Sorry! File not found 2')
            return keyName;

        }
    }
    
}

async function sendMessage (message, numbers){
    const options = {authorization : process.env.FAST_2_SMS_API_KEY  , sender_id:'R-grow', message : message ,  numbers : numbers} 
    const response = await fast2sms.sendMessage(options) 
    return response;
};