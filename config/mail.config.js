const nodemailer = require('nodemailer');

///// Email Configuration Start /////
// var transporter = nodemailer.createTransport({
//     host: 'elvirainfotechcloud.com',
//     port: 465,
//     auth: {
//       user: 'noreply@elvirainfotechcloud.com',
//       pass: 'f!z#7tz6DW&?'
//     }
// });
const transporter = nodemailer.createTransport({
    host: 'elvirainfotech.org',
    port: 465,
    auth: {
      user: 'noreply@elvirainfotech.org',
      pass: 'SX*JPHDIJM?N'
    }
});
///// Email Configuration End /////

global.mailConfig = transporter;