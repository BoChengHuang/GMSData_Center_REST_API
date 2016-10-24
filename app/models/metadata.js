var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var GMSSchema   = new Schema({
    id: String,
    rotation: String,
    pitch: Number,
    copyright: String,
    imageDate: String,
    location: Object,
    zoom: Number,
    links: Object,
    lat: Number,
    lng: Number
});

module.exports = mongoose.model('metadata', GMSSchema);