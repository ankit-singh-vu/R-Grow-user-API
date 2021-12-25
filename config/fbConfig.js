const admin = require('firebase-admin');

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "YOUR DATABASE URL"
// });

module.exports = admin;