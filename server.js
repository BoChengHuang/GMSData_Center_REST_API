// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require('path');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:9999/api/metadata');
    // res.setHeader('Access-Control-Allow-Origin', 'http://140.118.155.33:9999/api/metadata');

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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var mongoose   = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/gmsdata');

var port = process.env.PORT || 9999;        // set our port
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

// more routes for our API will happen here
var apis = require('./routes/apis');

app.use('/api', apis);