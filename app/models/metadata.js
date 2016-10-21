var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var GMSSchema   = new Schema({
    id: String,
    rotation: String,
    pitch: Number,
    copyright: Number,
    imageDate: String,
    location: Object,
    zoom: Number,
    links: Object
});

module.exports = mongoose.model('metadata', GMSSchema);