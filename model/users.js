const mongoose = require('mongoose');
const moment = require('moment');

const users = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: {
            type: String,
            default: ''
        },
        gender: {
            type: String,
            enum : ['M','F'],
        },
        password: String,
        progileImg: String,

        status: {
            type: String,
            enum : ['Y','N','B'], // Y = Yes, N = NO, B = Blocked
            default: 'Y'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: { 
            type: Date,
            default: Date.now
        }
    },
    { versionKey: false }
);

// Virtual for date generation
users.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});
users.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('rgrow_users', users);