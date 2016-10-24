var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var GMSSchema   = new Schema({
    pano_id: String,
    x: String,
    y: String,
    zoom: Number,
    data: String
});

module.exports = mongoose.model('gmsdata', GMSSchema);