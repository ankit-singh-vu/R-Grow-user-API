const dotenv = require('dotenv').config();
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const app = express();
const cors = require('cors');
const http = require('http').Server(app);
require('./config/db.config');

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});


app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    useTempFiles : true,
}));

app.use(cors());

////////////// Configuration //////////////
app.set('views',__dirname + '/views');
app.set('vew engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.json()); // parse form data client
app.use(express.urlencoded({ extended: true }));
// configure express to use public folder for app front end
app.use('/app-property',express.static(path.join(__dirname, 'public')));


//////////// Routes Start //////////////
app.get('/', (req, res) => {
    res.send("Welcome to RGrow User Website API. nov 16th 6:00");
});
app.use('/api', require('./routes/api'));
//////////// Routes End //////////////


http.listen(process.env.PORT, () => {
    console.log(`Server running on port : http://localhost:${process.env.PORT}`);
    // console.log(`Branch  : ${process.env.BRANCH}`);
});