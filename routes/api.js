const express = require('express');
const router = express.Router();
const { apiAuth } = require('../config/authentication');
const indexCon = require('../controller/apiController/indexCon');
const paymentCon = require('../controller/apiController/paymentCon');
const dataStats = require("../controller/apiController/dataStatsCon");
const appointmentCon= require("../controller/apiController/appointmentCon");

var request = require('request');


//customer login ,signup
router.post('/user-signup', indexCon.userRegistration);
router.post('/login', indexCon.userLogin);
router.post('/login-with-phone', indexCon.loginWithPhone);
router.post('/check-phone-exists', indexCon.checkphoneExists);

//customer profile update
router.patch('/phone-update', apiAuth, indexCon.userPhoneNoUpdate);
router.patch('/edit-profile', apiAuth, indexCon.editProfile);

//product
router.get('/product-list',  indexCon.getProducts);
router.get('/product-search-suggestion',  indexCon.getProductSuggestion);
router.get("/get-product/:productId",  indexCon.getProduct);

//retailer
router.get("/get-retailer-info/:retailerId", indexCon.getRetailerInfo);
router.get("/allretailer", indexCon.getAllRetailer);
router.get("/findNearbyStores",  indexCon.findNearbyStores);

//service
router.get('/service-list',  indexCon.getServices);
router.get('/service-search-suggestion',  indexCon.getServiceSuggestion);
router.get("/get-service/:serviceId",  indexCon.getService);

//cart
router.get('/cart-list', apiAuth, indexCon.getcart);
router.get('/cart-list-retailer-wise', apiAuth, indexCon.getcartRetailerwise);
router.get('/checkout-one-retailer', apiAuth, indexCon.checkoutOneRetailer);
router.post('/add-to-cart', apiAuth, indexCon.addToCart);
router.patch('/delete-cart-item', apiAuth, indexCon.deleteCartItem);
router.patch('/edit-cart-item', apiAuth, indexCon.editCartItem);
router.patch('/increase-cart-item', apiAuth, indexCon.increaseCartItem);
router.patch('/decrease-cart-item', apiAuth, indexCon.decreaseCartItem);

//order
router.get('/order-list/:CustomerId', apiAuth, indexCon.getOrders);
router.get('/order-group/:OrderNumber', apiAuth, indexCon.getOrdersGroup);
router.post('/request-order', apiAuth, paymentCon.createOrder);
router.post('/request-order-backend', apiAuth, paymentCon.createOrderBackend);
router.post('/request-order-backend-one-retailer', apiAuth, paymentCon.requestOrderBackendOneRetailer);
router.post('/send-message', apiAuth, paymentCon.sendMessage);

//sercvices  flow 

router.get('/appointments-list', apiAuth, appointmentCon.getAppointments);
router.post('/add-appointments', apiAuth, appointmentCon.addAppointments);


// router.get('/cart-list-retailer-wise-services', apiAuth, indexCon.getcartRetailerwise);
// router.get('/checkout-one-retailer-services', apiAuth, indexCon.checkoutOneRetailer);
// router.patch('/delete-cart-item-services', apiAuth, indexCon.deleteCartItem);
// router.patch('/edit-cart-item-services', apiAuth, indexCon.editCartItem);
// router.patch('/increase-cart-item-services', apiAuth, indexCon.increaseCartItem);
// router.patch('/decrease-cart-item-services', apiAuth, indexCon.decreaseCartItem);

// router.get('/order-list-services/:CustomerId', apiAuth, indexCon.getOrders);
// router.get('/order-group-services/:OrderNumber', apiAuth, indexCon.getOrdersGroup);
// router.post('/request-order-services', apiAuth, paymentCon.createOrder);
// router.post('/request-order-backend-services', apiAuth, paymentCon.createOrderBackend);
// router.post('/request-order-backend-one-retailer-services', apiAuth, paymentCon.requestOrderBackendOneRetailer);
// router.post('/send-message-services', apiAuth, paymentCon.sendMessage);


//reviews
router.get('/get-reviews/:reviewOfId',  indexCon.getReviews);
router.post('/add-reviews', apiAuth, indexCon.addReviews);

//adresss
router.get('/get-adresss-list/:CustomerId', apiAuth ,  indexCon.getCustomerAdresssList);
router.post('/add-adresss', apiAuth, indexCon.addAdresss);

//payment
// router.post('/create-order-razorpay', apiAuth, paymentCon.createOrderRazorpay);
// router.post("/save-payment-info", apiAuth, paymentCon.savePaymentinfo);
router.post("/verify-payment", apiAuth, paymentCon.verifyPayment);
router.get('/invoice/:invoiceId', indexCon.invoiceDownload);
// router.get('/invoice/:invoiceId',apiAuth, indexCon.invoiceDownload);
router.get("/getInvoice/:invoiceId",apiAuth,  indexCon.getInvoice);
router.get("/get-invoice-list/:CustomerId",apiAuth, indexCon.getInvoiceList);


// others
router.patch('/updatemany', indexCon.updatemany);
router.get('/groupby-retailers-services', indexCon.groupbyRetailerServices);
router.get('/groupby-products-services', indexCon.groupbyRetailerProducts);
router.get('/check-available-by-pincode', indexCon.checkAvailableByPincode);
router.post("/generateStatus",  dataStats.genStats);


router.get('/check-pincode/:pincode', function(req, res, next) {
    let uri ='https://api.postalpincode.in/pincode/'+req.params.pincode;
    request({
        uri: uri,
    })
    .pipe(res);
});  


router.get('*', async (req, res) => {
    res.status(404).json({ status: 'error', message: 'Sorry! API your are looking for has not been found'});
});
router.post('*', async (req, res) => {
    res.status(404).json({ status: 'error', message: 'Sorry! API your are looking for has not been found'});
});

module.exports = router;