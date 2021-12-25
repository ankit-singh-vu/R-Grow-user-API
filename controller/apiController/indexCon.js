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

const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});
module.exports = {

    userRegistration : async (req, res) => {
        try {
            const { phone,password } = req.body;
            // const { name,email,phone,password,referalCode } = req.body;
            // if((name) && (name !== "") && (email) && (email !== "") && (password) && (password !== "") && (phone) && (phone !== "")){
            if( (password) && (password !== "") && (phone) && (phone !== "")){
                // const checkUser = await User.find({ $or: [{ email: email }, { phone: phone }] });
                const checkUser = await User.find({ phone: phone });
                console.log(checkUser.length);
                if(checkUser.length === 0){
                    const user = new User({
                        // name: name,
                        // email: email,
                        phone: phone,
                        password: await bcrypt.hash(password, 10),
                        // referalCode: referalCode
                    });
                    const result1 = await user.save();
                    let result = result1.toObject();
                    delete result.password;
                    // console.log(result)
                    // delete result.data.password;
                    const accesstoken = tokens.createAccessToken(result._id);
                    const refreshToken = tokens.createRefreshToken(result._id);
                    await User.findByIdAndUpdate(result._id,{
                        refreshToken: refreshToken,
                        updatedAt: Date.now()
                    }, {new: true});

                    if(result.progileImg){
                        result.progileImg = await getSignedUrl(result.progileImg);
                    }
                    // res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                    res.status(200).json({ status: 'success', data: result, accessToken: accesstoken});
                }else{
                    return res.status(400).json({ status: 'error', error: 'Phone number already exists' });
                }
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },

    userLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            if(username && (username !== "") && password && (password !== "")){
                const result = await User.findOne({ $or: [{ phone: username }, { email: username }] }).lean()
                // .select("-password");
                // .select("-refreshToken");
                if(result){
                    if(result.status === 'Y'){
                        const matchResult = await bcrypt.compare(password, result.password);
                        if(matchResult === true){
                            const accesstoken = tokens.createAccessToken(result._id);
                            // const refreshToken = tokens.createRefreshToken(result._id);
                            // await User.findByIdAndUpdate(result._id,{
                            //     refreshToken: refreshToken,
                            //     updatedAt: Date.now()
                            // }, {new: true});
                            if(result.progileImg){
                                result.progileImg = await getSignedUrl(result.progileImg);
                            }
                            // return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                            delete result.password 

                            return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken });
                        }else{
                            return res.status(400).json({ status: 'error', error: "Incorrect Password." });
                        }
                    }else{
                        return res.status(400).json({ status: 'error', error: "Sorry! account is Temporarily blocked by administrator." });
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: "Sorry! No accounts found." });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', error: error.message });
        }
    },

    loginWithPhone: async (req, res) => {
        try {
            const { phone } = req.body;
            if(phone && (phone !== "")){
                // const result = await User.findOne({ $or: [{ phone: phone }] });
                const result = await User.findOne({ phone: phone }).lean()

                // .select("-refreshToken");
                if(result){
                    if(result.status === 'Y'){
                        const accesstoken = tokens.createAccessToken(result._id);
                        // const refreshToken = tokens.createRefreshToken(result._id);
                        // await User.findByIdAndUpdate(result._id,{
                        //     refreshToken: refreshToken,
                        //     updatedAt: Date.now()
                        // }, {new: true});
                        if(result.progileImg){
                            result.progileImg = await getSignedUrl(result.progileImg);
                        }
                        // return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken, refreshToken: refreshToken });
                        delete result.password 

                        return res.status(200).json({ status: 'success', data: result, accessToken: accesstoken });
                    }else{
                        return res.status(400).json({ status: 'error', error: "Sorry! account is Temporarily blocked by administrator." });
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: "Sorry! No accounts found." });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', error: error.message });
        }
    },

    userPhoneNoUpdate: async(req, res) => {
        try {
            const {phone, userId} = req.body;
            if(userId && (userId !== "") && (phone) && (phone !== "")){
                const checkUserPhone = await User.findOne({ 
                    $and: [
                        { _id: { $ne: userId } },
                        { $or: [{ phone: phone }] }
                    ]
                });
                if(checkUserPhone){
                    return res.status(203).json({ status: 'error', error: "Sorry! phone no already registered." });
                }else{
                    const updateData = { phone: phone, updatedAt: Date.now() };
                    const updateResult = await User.findByIdAndUpdate(userId,updateData, {new: true}).select("-password");
                    if(updateResult){
                        if(updateResult.progileImg){
                            updateResult.progileImg = await getSignedUrl(updateResult.progileImg);
                        }
                        return res.status(200).json({ status: 'success', data: updateResult });
                    }else{
                        res.status(203).json({ status:'error', error: "Sorry! Something went wrong." });
                    }
                }
            }else{
                res.status(203).json({ status:'error', error: "Sorry! Parameter missing or value missing." });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },

    editProfile: async (req, res) => {
        try {
            const {status, gender, phone, name, email, password, userId } = req.body;
            // const { name, email, password, userId } = req.body;
            if(userId && (userId !== "") && (userId !== null) && (userId !== undefined)){
                const updateData = { updatedAt: Date.now() };
                if(email && (email !== "") && (email !== undefined) && (email !== "")){
                    const checkUserEmail = await User.findOne({ 
                        $and: [
                            { _id: { $ne: userId } },
                            { $or: [{ email: email }] }
                        ]
                    });
                    if(checkUserEmail){
                        return res.status(400).json({ status: 'error', error: "Sorry! Email Id already registered." });
                    }else{
                        updateData['email'] = email;
                    }
                }
                if(req.files && req.files.profilePic){
                    const allowType = ['image/png', 'image/jpeg', 'image/jpg'];
                    const uploadedFile = req.files.profilePic;
                    updateData['progileImg'] = await fileUpload(uploadedFile,"profile-pic-"+userId,allowType);
                }
                if(name && (name !== "") && (name !== undefined)) updateData['name'] = name;
                if(phone && (phone !== "") && (phone !== undefined)) updateData['phone'] = phone;
                if(gender && (gender !== "") && (gender !== undefined)) updateData['gender'] = gender;
                if(status && (status !== "") && (status !== undefined)) updateData['status'] = status;
                if(password && (password !== "") && (password !== undefined)) updateData['password'] = await bcrypt.hash(password, 10);
                const updateResult = await User.findByIdAndUpdate(userId,updateData, {new: true}).select("-password");
                if(updateResult){
                    if(updateResult.progileImg){
                        updateResult.progileImg = await getSignedUrl(updateResult.progileImg);
                    }
                    return res.status(200).json({ status: 'success', data: updateResult });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    addAdresss: async (req, res) => {
        try {
          const {
            CustomerId,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            country,
          } = req.body;
          if (
            CustomerId &&
            CustomerId !== "" &&
            addressLine1 &&
            addressLine1 !== "" &&
            city &&
            city !== "" &&            
            state &&
            state !== "" &&
            pincode &&
            pincode !== "" &&
            country &&
            country !== ""
          ) {
              const address = new Address({
                CustomerId,
                addressLine1,
                addressLine2,
                city,
                state,
                pincode,
                country
              });
              const result = await address.save();
              return res
              .status(200)
              .json({ status: "success", data: result });

          } else {
            return res.status(400).json({
              status: "error",
              error: "Sorry! Parameter missing.",
            });
          }
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },

    getCustomerAdresssList: async (req, res) => {
        try {
            const {
                CustomerId
              } = req.params;

            if (CustomerId && CustomerId !== "") {
                const address = await Address.find({ CustomerId: CustomerId });
                return res
                .status(200)
                .json({ status: "success", data: address });
            }
            else{
                return res
                .status(400)
                .json({ status: "error", error: "Customer Id  missing" });
            }
        } catch (error) {
            return res.status(400).json({ status: "error", error: error.message });
        }
    },    

    getProduct: async (req, res) => {
        try {
            const { productId } = req.params;
            if (productId && productId !== "") {
                const retailerproducts = await Product.findById({ _id: productId }).populate("retailerId","-password -services -products");
                for (let j = 0; j < retailerproducts.productImages.length; j++) {
                    retailerproducts.productImages[j].image = await getSignedUrl(
                    retailerproducts.productImages[j].image
                    );
                }

                return res
                .status(200)
                .json({ status: "success", data: retailerproducts });
            }
            else{
                return res
                .status(400)
                .json({ status: "error", error: "product Id missing" });
            }
        } catch (error) {
            return res.status(400).json({ status: "error", error: error.message });
        }
    },

    getProducts: async (req, res) => {
        let f=getFiltersProduct(req)

        try {
            let retailerproducts,total;
            let {page,size,latitude,longitude}=req.query;
            if(!page) page=1
            if(!size) size=10
            const limit=parseInt(size);
            const skip=(page -1 )* size;

            let radius=100;//default 100km
            if(req.query.radius) radius=req.query.radius 
            radius=radius*1000;//converting in  metres             

            if(latitude && longitude){
                let f1={};
                f1.storeLocation= {
                      $near: {
                       $maxDistance: radius,
                       $geometry: {
                        type: 'Point',
                        coordinates: [
                            latitude,
                            longitude
                        ]
                       }
                      }
                     }
                
                let retailer = await Retailer.find(f1)
                     

                let retailerId_arr=[];
                for (let index = 0; index < retailer.length; index++) {
                    // console.log(JSON.stringify(retailer[index].storeLocation))
                    retailerId_arr.push(retailer[index]._id);
                }
                // console.log(retailerId_arr)
                f.filter.retailerId= { $in: retailerId_arr } 
 
            }

      
            let order_condition={}
            if(req.query.sortby) {
                if(req.query.sortby=='price_high_to_low') {
                    order_condition.price=-1
                }
                if(req.query.sortby=='price_low_to_high') {
                    order_condition.price=1
                }
                if(req.query.sortby=='new_first') {
                    order_condition.createdAt=-1
                }
                if(req.query.sortby=='popular') {
                    order_condition.createdAt=1
                }
            }
            else{
                order_condition.createdAt=-1//by default new_first
            }


            retailerproducts = await Product.find(f.filter,null).populate("retailerId","-password -services -products")
            .sort(order_condition)
            .collation({locale: "en_US", numericOrdering: true})
            .limit(limit)
            .skip(skip)

            total = await Product.find(f.filter).countDocuments();

            for (let i = 0; i < retailerproducts.length; i++) {
                //retailer profile
                if(retailerproducts[i].retailerId)
                {
                    if(retailerproducts[i].retailerId.profilePic)
                    {
                        retailerproducts[i].retailerId.profilePic = await getSignedUrl(
                            retailerproducts[i].retailerId.profilePic
                        );
                    } 
                } 

                //products images
                for (let j = 0; j < retailerproducts[i].productImages.length; j++) {
                    retailerproducts[i].productImages[j].image = await getSignedUrl(
                      retailerproducts[i].productImages[j].image
                    );
                }                
            }
    
            return res
              .status(200)
            //   .json({ status: "success", total:total, items_returned:retailerproducts.length, data: retailerproducts });
              .json({ status: "success", total:total, items_returned:retailerproducts.length,page:page,size:size, data: retailerproducts });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },
    
    getProductSuggestion: async (req, res) => {
        let f=getFiltersProduct(req)

        try {
            const retailerproducts = await Product
            .find(f.filter,null, {sort: {createdAt: f.order}})
            .select("productName productCategory -_id")
            .limit(10)

            const total = await Product.find(f.filter).countDocuments();


            return res
              .status(200)
              .json({ status: "success",total:total, data: retailerproducts });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },   



    //-------------retailer--------------------
    getRetailerInfo: async (req, res) => {
        try {
          const { retailerId } = req.params;
          if (retailerId && retailerId !== "") {
            const retailer = await Retailer.findById({ _id: retailerId });
    
            if(retailer.profilePic){
              retailer.profilePic = await getSignedUrl(retailer.profilePic);
            }
          
    
            return res
              .status(200)
              .json({ status: "success", data: retailer });
          } else {
            return res
              .status(400)
              .json({ status: "error", error: "retailer Id missing" });
          }
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
      },


    findNearbyStores: async (req, res) => {
        try {
          const { latitude, longitude } = req.query;
          
          let radius=100;//default 100km
          if(req.query.radius) radius=req.query.radius 
          radius=radius*1000;//converting in  metres 

          if (latitude && latitude !== "" && longitude && longitude !== "") {

            const stores = await Retailer.find({
              storeLocation: {
                $near: {
                  $maxDistance: radius,
                  $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(latitude), parseFloat(longitude)],
                  },
                },
              },
            });
            if (stores) {
              return res.status(200).json({ status: "Success", total:stores.length, data: stores });
            } else {
              return res
                .status(404)
                .json({ status: "Success", message: "No nearby stores available" });
            }
          }
        } catch (error) {
          return res.status(400).send(error);
        }
    },

    getAllRetailer: async (req, res) => {
        try {
            let {page,size}=req.query;
            if(!page) page=1
            if(!size) size=10
            const limit=parseInt(size);
            const skip=(page -1 )* size;

            // let f=getFiltersRetailer(req)
            // const retailer = await Retailer.find(f.filter,null, {sort: {createdAt: f.order}})
            const retailer = await Retailer.find({},null, {sort: {createdAt: -1}})
            .select("-password -services -products")
            .limit(limit)
            .skip(skip)

            // const total = await Retailer.find(f.filter).countDocuments();
            const total = await Retailer.find().countDocuments();
            for (let i = 0; i < retailer.length; i++) {
            //retailer profile
                if(retailer[i].profilePic)
                {
                    retailer[i].profilePic = await getSignedUrl(retailer[i].profilePic);
                }              
            }
            return res.status(200)
            .json({ status: "success", total:total, items_returned:retailer.length,page:page,size:size, data: retailer });
        } catch (error) {}
    },
    //-------------services--------------------
    
    
    

    getService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            if (serviceId && serviceId !== "") {
                const retailerservice = await Service.findById({ _id: serviceId }).populate("retailerId","-password -services -products");

                if(retailerservice.retailerId && retailerservice.retailerId.profilePic)
                {   retailerservice.retailerId.profilePic = await getSignedUrl(
                    retailerservice.retailerId.profilePic) ;
                }

                for (let j = 0; j < retailerservice.serviceImages.length; j++) {
                    retailerservice.serviceImages[j].image = await getSignedUrl(
                    retailerservice.serviceImages[j].image
                    );
                }

                return res
                .status(200)
                .json({ status: "success", data: retailerservice });
            }
            else{
                return res
                .status(400)
                .json({ status: "error", error: "product Id missing" });
            }
        } catch (error) {
            return res.status(400).json({ status: "error", error: error.message });
        }
    },

    getServices: async (req, res) => {
        let f=getFiltersService(req)

        try {
            let {page,size,latitude,longitude}=req.query;

            if(!page) page=1
            if(!size) size=10
            const limit=parseInt(size);
            const skip=(page -1 )* size;

            let radius=100;//default 100km
            if(req.query.radius) radius=req.query.radius 
            radius=radius*1000;//converting in  metres 

            if(latitude && longitude){
                let f1={};
                f1.storeLocation= {
                      $near: {
                       $maxDistance: radius,
                       $geometry: {
                        type: 'Point',
                        coordinates: [
                            latitude,
                            longitude
                        ]
                       }
                      }
                     }
                
                let retailer = await Retailer.find(f1)
                     

                let retailerId_arr=[];
                for (let index = 0; index < retailer.length; index++) {
                    // console.log(JSON.stringify(retailer[index].storeLocation))
                    retailerId_arr.push(retailer[index]._id);
                }
                // console.log(retailerId_arr)
                f.filter.retailerId= { $in: retailerId_arr } 
 
            }

            const retailerservice = await Service.find(f.filter,null, {sort: {createdAt: f.order}})
            .populate("retailerId","-password -services -products")
            .limit(limit)
            .skip(skip)

            const total = await Service.find(f.filter).countDocuments();

            for (let i = 0; i < retailerservice.length; i++) {
                //retailer profile
                if(retailerservice[i].retailerId)
                {
                    if(retailerservice[i].retailerId.profilePic)
                    {
                        retailerservice[i].retailerId.profilePic = await getSignedUrl(
                            retailerservice[i].retailerId.profilePic
                        );
                    } 
                } 

                //services images
                for (let j = 0; j < retailerservice[i].serviceImages.length; j++) {
                    retailerservice[i].serviceImages[j].image = await getSignedUrl(
                      retailerservice[i].serviceImages[j].image
                    );
                }                
            }
    
            return res
              .status(200)
            //   .json({ status: "success", total:total, items_returned:retailerservice.length, data: retailerservice });
              .json({ status: "success", total:total, items_returned:retailerservice.length,page:page,size:size, data: retailerservice });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },
    
    getServiceSuggestion: async (req, res) => {
        let f=getFiltersService(req)

        try {
            const retailerproducts = await Service
            .find(f.filter,null, {sort: {createdAt: f.order}})
            .select("description serviceCategory -_id")
            .limit(10)

            const total = await Service.find(f.filter).countDocuments();


            return res
              .status(200)
              .json({ status: "success",total:total, data: retailerproducts });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },   

 
    // ==========================Not required now====================================    

    checkphoneExists: async (req, res) => {
        try {
            const { userId } = req.body;
            if(userId && userId !== ""){
                const checkUser = await User.findById(userId);
                if(checkUser){
                    if(!checkUser.phone){
                        return res.status(200).json({ status: 'error', error: "Phone number not found" });
                    }else{
                        if((checkUser.phone === null) || (checkUser.phone === "")){
                            return res.status(200).json({ status: 'error', error: "Phone number not found" });
                        }else{
                            return res.status(200).json({status: 'success'});
                        }
                    }
                }else{
                    return res.status(400).json({ status: 'error', error: 'Sorry! User not Found.' });
                }
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },   

 
        
    
    getcart: async (req, res) => {

        try {
            let retailerproducts;
            let  filter={}
            let query=req.query;
            console.log(query)

            filter.userId=query.userId
            filter.is_save_for_later=query.is_save_for_later
            filter.is_delete=0

            retailerproducts = await Cart.find(filter,null, {sort: {createdAt: -1}})
            .populate("retailerId","retailerName")
            .populate("productId","productName description productImages")



            for (let i = 0; i < retailerproducts.length; i++) {
                //products images
                for (let j = 0; j < retailerproducts[i].productId.productImages.length; j++) {
                    retailerproducts[i].productId.productImages[j].image = await getSignedUrl(
                      retailerproducts[i].productId.productImages[j].image
                    );
                }                
            }
    
            return res
              .status(200)
              .json({ status: "success", items_returned:retailerproducts.length, data: retailerproducts });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },


    getcartRetailerwise: async (req, res) => {
        try {
            let  filter={}
            let query=req.query;
            // console.log(query)

            filter.userId=query.userId
            filter.is_save_for_later=query.is_save_for_later
            filter.is_delete=0

            let distinct_retailers=await Cart.distinct( "retailerId",filter )


            let retailer_wise_items=[]
            let items_count=0;
            let total_amount=0
            let total_price=0
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

                for (let i = 0; i < x.length; i++) {
                    for (let j = 0; j < x[i].productId.productImages.length; j++) {
                        x[i].productId.productImages[j].image = await getSignedUrl(
                          x[i].productId.productImages[j].image
                        );
                    }                
                }


                for (let j = 0; j < x.length; j++) {
                    ++items_count;
                    total_price=total_price+Number(x[j].total_cost_price);
                    total_amount=total_amount+Number(x[j].total_selling_price);
                    // x[j].delivered_date=new Date(new Date().getTime()+(7*24*60*60*1000));//7days
                }

                let obj={}
                obj.retailerId=distinct_retailers[i]
                obj.retailer_info=retailer_info
                obj.delivered_date=new Date(new Date().getTime()+(7*24*60*60*1000));//7days
                obj.items=x
                retailer_wise_items.push( obj );


                
            }
                // console.log(retailer_wise_items)
                let approx_delivered_date = new Date(new Date().getTime()+(7*24*60*60*1000));//after 10 days

                let reurn_result={
                    // approx_delivered_date:approx_delivered_date,
                    items_count:items_count,
                    total_price:total_price,
                    total_amount:total_amount,
                    orders:retailer_wise_items
                }

            return res
                .status(200)
                .json({ status: "success", data: reurn_result });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },    

    checkoutOneRetailer: async (req, res) => {
        try {
            let  filter={}
            let query=req.query;
            // console.log(query)

            filter.userId=query.userId
            // filter.is_save_for_later=query.is_save_for_later
            filter.is_save_for_later=0
            filter.is_delete=0


            let retailerId=query.retailerId;
            // let distinct_retailers=await Cart.distinct( "retailerId",filter )

            let distinct_retailers=[];
            distinct_retailers.push( retailerId );


            let retailer_wise_items=[]
            let items_count=0;
            let total_amount=0
            let total_price=0
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
                for (let i = 0; i < x.length; i++) {
                    for (let j = 0; j < x[i].productId.productImages.length; j++) {
                        x[i].productId.productImages[j].image = await getSignedUrl(
                          x[i].productId.productImages[j].image
                        );
                    }                
                }

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

                let reurn_result={
                    // approx_delivered_date:approx_delivered_date,
                    items_count:items_count,
                    total_price:total_price,
                    total_amount:total_amount,
                    orders:one_retailer_wise_items
                }

            return res
                .status(200)
                .json({ status: "success", data: reurn_result });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },      

    deleteCartItem: async (req, res) => {
        try {
            const {
                cartItemid,
            } = req.body;

            if(cartItemid && (cartItemid !== "") ){
                
                const updateData = { updatedAt: Date.now() };
                // if(name && (name !== "") && (name !== undefined)) updateData['name'] = name;
                updateData['is_delete'] = 1;

                const updateResult = await Cart.findByIdAndUpdate(cartItemid,updateData, {new: true})
                if(updateResult){
                    return res.status(200).json({ status: 'success', data: updateResult });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    editCartItem: async (req, res) => {
        try {
            const {
                cartItemid,
            } = req.body;

            if(cartItemid && (cartItemid !== "") ){
                
                const updateData = { updatedAt: Date.now() };
                // if(name && (name !== "") && (name !== undefined)) updateData['name'] = name;
                
                if(req.body.is_save_for_later) {
                    updateData['is_save_for_later']=req.body.is_save_for_later
                }

                if(req.body.quantity) {
                    const {
                        quantity,
                    } = req.body;
                    let cart_item = await Cart.findOne({ _id: cartItemid})
                    // .select("cost_price selling_price");
                    // console.log(cart_item)
                    updateData['quantity']=quantity
                    updateData['total_cost_price']=quantity*Number(cart_item.cost_price);
                    updateData['total_selling_price']=quantity*Number(cart_item.selling_price);
                    if(quantity<=0){
                        return res.status(400).json({ status: 'error', error: "Quantity should be minimum 1" });
                    }

                    let product = await Product.findOne({ _id: cart_item.productId});
                    let q = Number(product.quantity); 
                    if(q  <= 0){
                        return res.status(400).json({ status: 'error', error: ' Out of Stock ' });
                    }
                    if(q<quantity){
                        return res.status(400).json({ status: 'error', error: ' Only '+q+' quantity of this product is availble with the retailer. Please reduce the quantity and try again.' });
                    }
                }

                // console.log(updateData)

                const updateResult = await Cart.findByIdAndUpdate(cartItemid,updateData, {new: true})
                if(updateResult){
                    return res.status(200).json({ status: 'success', data: updateResult });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    addToCart : async (req, res) => {
        try {
            const {
                productId,
                userId
            } = req.body;
            
            if( (productId) && (productId !== "") && (userId) && (userId !== "")){
                let quantity=1;

                if(req.body.quantity)
                quantity=req.body.quantity;
                quantity=Number(quantity);
                let product = await Product.findOne({ _id: productId});
                // console.log(product);
                let q = Number(product.quantity); 

                let already_in_cart_condition={}
                already_in_cart_condition.productId=productId;
                already_in_cart_condition.userId=userId;
                already_in_cart_condition.is_delete=0;
                already_in_cart_condition.is_save_for_later=0;

                let already_in_cart = await Cart.find(already_in_cart_condition);

                if(already_in_cart.length>0){
                    // return res.status(200).json({ status: 'success', data: already_in_cart[0]});
                    let update_data={}
                    let update_qty=Number(already_in_cart[0].quantity)+quantity;

                    if(q<update_qty){
                        return res.status(400).json({ status: 'error', error: ' Only '+q+' quantity of this product is available with the retailer. Please reduce the quantity and try again.You are requesting for '+update_qty+' quantity .' });
                    }

                    update_data.quantity=update_qty
                    update_data.cost_price=product.price,
                    update_data.selling_price=product.price,
                    update_data.total_cost_price=Number(product.price)*update_qty,
                    update_data.total_selling_price=Number(product.price)*update_qty,
                    update_data.updatedAt=Date.now();
                    


                    let updated_result = await Cart.findByIdAndUpdate(already_in_cart[0]._id, {"$set":update_data},{new: true});
                    return res.status(200).json({ status: 'success', data: updated_result});
                }

                if(q<quantity){
                    return res.status(400).json({ status: 'error', error: ' Only '+q+' quantity of this product is available with the retailer. Please reduce the quantity and try again.You are requesting for '+quantity+' quantity .' });
                }
                if(q  > 0){
                    const cart = new Cart({
                        productId,
                        retailerId:product.retailerId,
                        userId,
                        quantity,
                        cost_price:product.price,
                        selling_price:product.price,
                        // offer_percent,
                        total_cost_price:product.price*quantity,
                        total_selling_price:product.price*quantity,
                    });
                    const result = await cart.save();

                    return res.status(200).json({ status: 'success', data: result});
                    // res.status(200).json({ status: 'success', data: 1});
                }else{
                    return res.status(400).json({ status: 'error', error: ' Out of Stock ' });
                }
            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            return res.status(400).json({ status:'error', error: error.message });
        }
    },  
    
    increaseCartItem: async (req, res) => {
        try {
            const {
                cartItemid,
            } = req.body;

            if(cartItemid && (cartItemid !== "") ){
                
                let quantity=1
                quantity=Number(quantity);
                let cart_item = await Cart.findOne({ _id: cartItemid})
                let product = await Product.findOne({ _id: cart_item.productId});
                let q = Number(product.quantity); 

                let update_data={}
                let update_qty=Number(cart_item.quantity)+quantity;//+1

                update_data.quantity=update_qty
                update_data.cost_price=product.price,
                update_data.selling_price=product.price,
                update_data.total_cost_price=Number(product.price)*update_qty,
                update_data.total_selling_price=Number(product.price)*update_qty,
                update_data.updatedAt=Date.now();


                if(q  <= 0){
                    return res.status(400).json({ status: 'error', error: ' Out of Stock ' });
                }
                if(q<quantity){
                    return res.status(400).json({ status: 'error', error: ' Only '+q+' quantity of this product is availble with the retailer. Please reduce the quantity and try again.You are requesting for '+update_qty+' quantity .' });
                    
                }

                console.log(update_data)

                const updateResult = await Cart.findByIdAndUpdate(cartItemid,update_data, {new: true})
                if(updateResult){
                    return res.status(200).json({ status: 'success', data: updateResult });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    decreaseCartItem: async (req, res) => {
        try {
            const {
                cartItemid,
            } = req.body;

            if(cartItemid && (cartItemid !== "") ){
                
                let quantity=-1
                quantity=Number(quantity);
                let cart_item = await Cart.findOne({ _id: cartItemid})
                let product = await Product.findOne({ _id: cart_item.productId});
                let q = Number(product.quantity); 

                let update_data={}
                let update_qty=Number(cart_item.quantity)+quantity;//+1

                update_data.quantity=update_qty
                update_data.cost_price=product.price,
                update_data.selling_price=product.price,
                update_data.total_cost_price=Number(product.price)*update_qty,
                update_data.total_selling_price=Number(product.price)*update_qty,
                update_data.updatedAt=Date.now();

                if(update_qty<=0)
                {
                    //delete from cart
                    const delete_data = { updatedAt: Date.now() };
                    delete_data['is_delete'] = 1;
                    const updateResult = await Cart.findByIdAndUpdate(cartItemid,delete_data, {new: true})
                    return res.status(200).json({ status: 'success', data: updateResult });
                }


                if(q  <= 0){
                    return res.status(400).json({ status: 'error', error: ' Out of Stock ' });
                }
                if(q<quantity){
                    return res.status(400).json({ status: 'error', error: ' Only '+q+' quantity of this product is availble with the retailer. Please reduce the quantity and try again.You are requesting for '+update_qty+' quantity .' });
                }

                // console.log(update_data)

                const updateResult = await Cart.findByIdAndUpdate(cartItemid,update_data, {new: true})
                if(updateResult){
                    return res.status(200).json({ status: 'success', data: updateResult });
                }
            }else{
                return res.status(400).json({ status: 'error', error: "Sorry! Something went wrong" });
            }
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },



    updatemany: async (req, res) => {
        try {
            let condition={}
            let update_data={}
            update_data.rating_avg="5";
            update_data.reviews_count=1;
            await Retailer.updateMany(condition, {"$set":update_data},{new: true});
            return res.status(200).json({ status: 'success',message: "updated succesfully"});
        } catch (error) {
            return res.status(400).json({ status: 'error', message: error.message });
        }
    },

    groupbyRetailerProducts: async (req, res) => {
        try {
            let retailerproducts= await Product.aggregate(
                [
                   {
                      $group:{_id:"$retailerId",Total:{$sum:1}}
                   }
                ]
            );
            return res
              .status(200)
              .json({ status: "success", items_returned:retailerproducts.length, data: retailerproducts });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },   

    groupbyRetailerServices: async (req, res) => {
        try {
            let retailerproducts= await Service.aggregate(
                [
                   {
                      $group:{_id:"$retailerId",Total:{$sum:1}}
                   }
                ]
            );
            return res
              .status(200)
              .json({ status: "success", items_returned:retailerproducts.length, data: retailerproducts });
       
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },       

    getOrdersGroup: async (req, res) => {
        try {
            const {
                OrderNumber
              } = req.params;
            let order_condition={}
            order_condition.OrderId=OrderNumber;
            let orders = await Order.findOne(order_condition)
            .populate("orders.product")
            .populate("userId")
            .populate(
                "retailerId",
                "_id retailerName addressLine1 addressLine2 state country email phone"
              )
            .lean();

            for (let i = 0; i < orders.orders.length; i++) {
                for (let j = 0; j < orders.orders[i].product.productImages.length; j++) {
                    orders.orders[i].product.productImages[j].image = await getSignedUrl(orders.orders[i].product.productImages[j].image)
                }

            }

            let invoice_condition={}
            invoice_condition.orderIdForInv=OrderNumber;
            let invoice = await Invoice.findOne(invoice_condition).lean();
            // console.log(invoice)
            orders.invoice=invoice;
            // console.log(orders.orders)
            // console.log(orders.invoice)
            // console.log(orders.selected_address_id)
            if(orders.selected_address_id!=null || orders.selected_address_id!=''){
                let c_address = await Address.findOne({
                    _id: orders.selected_address_id
                    }).lean()
                    //   console.log(c_address)
                      orders.userId.selected_address=c_address;
            }
            return res
              .status(200)
              .json({ status: "success",  data: orders });
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    }, 

    getOrders: async (req, res) => {
        try {
            const {
                CustomerId
              } = req.params;
              let condition={}
              condition.userId=CustomerId
            let orders = await Order.find(condition)
            .populate("orders.product")
            // .populate("orders.product.retailerId")
            .populate("retailerId")
            .sort({createdAt:-1})
            .lean();
            // total = await Order.find(condition).countDocuments();

            let orders_product_wise=[];
            for (let i = 0; i < orders.length; i++) {
                // const element = orders[i];
                console.log(orders[i].OrderId)
                
                for (let j = 0; j < orders[i].orders.length; j++) {
                    // const element = orders[i].orders[j];
                    console.log(orders[i].orders[j])
                    let ob={}
                    ob=orders[i].orders[j]
                    ob.OrderNumber=orders[i].OrderId
                    ob.retailer=orders[i].retailerId.retailerName

                    orders_product_wise.push(ob)

                    
                }
            }
          
            return res
              .status(200)
              .json({ status: "success", items_returned:orders_product_wise.length, data: orders_product_wise });
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    }, 

    
    getInvoice: async (req, res) => {
        const { invoiceId } = req.params;
        try {
          const invoice = await Invoice.findById({
            _id: invoiceId,
          })
            .populate({
              path: "orderId",
              populate: {
                path: "orders.product",
              },
            })
            // "orderId.orders.product"
            .populate("userId")
            .populate(
              "retailerId",
              "_id retailerName addressLine1 addressLine2 state country email phone"
            );
          // .populate("product","-password -services -products")
    

          if(invoice){
            return res.status(200).json({
                status: "success",
                invoice: invoice,
              });
          }
          else
          {
            return res.status(400).json({ status: "error", error: "Invoice not Generated" });
          }



        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },  

    invoiceDownload: async (req, res) => {
        const { invoiceId } = req.params;
        try {
          let invoice = await Invoice.findById({
            _id: invoiceId,
          })
            .populate({
              path: "orderId",
              populate: {
                path: "orders.product",
              },
            })
            // "orderId.orders.product"
            .populate("userId")
            .populate(
              "retailerId",
              "_id retailerName addressLine1 addressLine2 state country email phone"
            );

            let c_address = await Address.findOne({
                _id: invoice.orderId.selected_address_id
              })

            //   console.log(c_address)
              invoice.userId.address=c_address;

          if(invoice){
            
            let filename=invoice.invoice_number+'.pdf';
              const stream = res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment;filename=`+filename,
                // 'Content-Disposition': `attachment;filename=`+filename,
                // 'Content-Disposition': `inline;filename=invoice.pdf`,
              });
          
              pdfService.buildPDF(
                (chunk) => stream.write(chunk),
                () => stream.end(),
                invoice
              );
          }
          else
          {
            return res.status(400).json({ status: "error", error: "Invoice not Generated" });
          }



        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },  

    // invoiceDownload: async (req, res) => {
    //     const { invoiceId } = req.params;
    //     try {
    //       let invoice = await Invoice.findById({
    //         _id: invoiceId,
    //       })
    //         .populate({
    //           path: "orderId",
    //           populate: {
    //             path: "orders.product",
    //           },
    //         })
    //         // "orderId.orders.product"
    //         .populate("userId")
    //         .populate(
    //           "retailerId",
    //           "_id retailerName addressLine1 addressLine2 state country email phone"
    //         );

    //         let c_address = await Address.findOne({
    //             _id: invoice.orderId.selected_address_id
    //           })

    //         //   console.log(c_address)
    //           invoice.userId.address=c_address;

    //       if(invoice){
            
    //         // let filename=invoice.invoice_number+'.pdf';
    //         //   const stream = res.writeHead(200, {
    //         //     'Content-Type': 'application/pdf',
    //         //     'Content-Disposition': `attachment;filename=`+filename,
    //         //     // 'Content-Disposition': `attachment;filename=`+filename,
    //         //     // 'Content-Disposition': `inline;filename=invoice.pdf`,
    //         //   });
          
    //         //   pdfService.buildPDF(
    //         //     (chunk) => stream.write(chunk),
    //         //     () => stream.end(),
    //         //     invoice
    //         //   );
    //           var file = fs.createReadStream('./public/output.pdf');
    //           var stat = fs.statSync('./public/output.pdf');
    //           res.setHeader('Content-Length', stat.size);
    //           res.setHeader('Content-Type', 'application/pdf');
    //           res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
    //           file.pipe(res);

    //       }
    //       else
    //       {
    //         return res.status(400).json({ status: "error", error: "Invoice not Generated" });
    //       }



    //     } catch (error) {
    //       return res.status(400).json({ status: "error", error: error.message });
    //     }
    // },  

    getInvoiceList: async (req, res) => {
        const { CustomerId } = req.params;
        try {
          const invoice = await Invoice.find({
            userId: CustomerId
          })
            .populate({
              path: "orderId",
              populate: {
                path: "orders.product",
              },
            })
            .populate("userId")
            .populate(
              "retailerId",
              "_id retailerName addressLine1 addressLine2 state country email phone"
            );
    

          if(invoice.length>0){
            return res.status(200).json({
                status: "success",
                invoice: invoice,
              });
          }
          else
          {
            return res.status(400).json({ status: "error", error: "Invoice not Generated" });
          }



        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    },      


    checkAvailableByPincode: async (req, res) => {
        try {          

            let {pincode,retailerId}=req.query;
            if(pincode>=700001 && pincode<=743165){
                return res
                .status(200)
                .json({ status: "success", message:"Delivery Available" });
            }
            else{
                return res.status(400).json({ status: "error", error: "Delivery Unavailable" });
            }
            
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    }, 

    //reviews-----------------------------
    addReviews: async (req, res) => {
        try {
            const {
                rate,
                review,
                reviewOfId,
                reviewbyId,
                reviewOftype,
                reviewBytype
            } = req.body;
            if(reviewOfId && reviewOfId !== ""){
                const rating = new Rating({
                    rate:rate,
                    review:review,
                    reviewOfId:reviewOfId,
                    reviewbyId:reviewbyId,
                    reviewOftype:reviewOftype,
                    reviewBytype:reviewBytype
                });
                const result1 = await rating.save();

                //----------------update avg rating and reviews count code left-------
                // let condition={}
                // condition.reviewOfId=reviewOfId
                // let previous_rating = await Product.find(condition).countDocuments();
                // // console.log(previous_rating)
                // previous_rating.rate

                // let updateData = { updatedAt: Date.now() };
                // updateData['rating_avg'] = 1;

                // const updateResult = await Cart.findByIdAndUpdate(cartItemid,updateData, {new: true})

                return res
                .status(200)
                .json({ status: "success",data: result1 })
                // .json({ status: "success",data: previous_rating })

            }else{
                return res.status(400).json({ status: 'error', error: 'Sorry! Parameter missing.' });
            }
        } catch (error) {
            res.status(400).json({ status:'error', error: error.message });
        }
    },   

    getReviews: async (req, res) => {
        try {
            const { reviewOfId } = req.params;
            let condition={}
            condition.reviewOfId=reviewOfId
            let rating = await Rating.find(condition).lean()
            //done only for customer , retailer left
            for (let i = 0; i < rating.length; i++) {
                rating[i].reviewby = await User.findById(rating[i].reviewbyId).select("name")
            }
            total = await Rating.find().countDocuments();
          
            return res
              .status(200)
              .json({ status: "success", total:total, items_returned:rating.length, data: rating });
        } catch (error) {
          return res.status(400).json({ status: "error", error: error.message });
        }
    }, 
}

function getFiltersProduct(req) {
    let filter={}
    // console.log(req.query)
    if(req.query.q) filter.productName={$regex:req.query.q,$options: 'i'};    


    filter.status=1;

    // console.log(filter)
    var f={
        filter:filter,
    }
    return f;

}

function getFiltersService(req) {
    let filter={}
    // console.log(req.query)
    if(req.query.q) filter.description={$regex:req.query.q,$options: 'i'};  

    filter.status=1;

    let order;
    order = -1//desc
    if(req.query.order) order=req.query.order;
    // console.log(filter)
    var f={
        filter:filter,
        order:order
    }
    return f;

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

