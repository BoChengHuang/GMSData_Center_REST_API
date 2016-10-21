var request = require('request').defaults({ encoding: null });
var aUrl = 'http://maps.google.com/cbk?output=tile&panoid=W956noQFxUP1cJH0-uYkKA&zoom=5&x=10&y=10&20161019';
request.get(aUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        data = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');
        console.log(data);
    }
});