var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PanoramaSchema   = new Schema({
    pano_id: String,
    links: Object
});

module.exports = mongoose.model('panoramaSchema', PanoramaSchema);