// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var mongoose   = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/gmsdata');
var Gmsdata       = require('./app/models/gmsdata');


var port = process.env.PORT || 9999;        // set our port
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

// more routes for our API will happen here
var apis = require('./routes/apis');

app.use('/api', apis);
