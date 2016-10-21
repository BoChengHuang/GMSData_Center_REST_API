var express = require('express');
var router = express.Router();
var Gmsdata = require('../app/models/gmsdata');
var fs = require('fs');
var request = require('request').defaults({ encoding: null });

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

router.get("/overview", function(req, res) {  
    var file = __dirname + '../../public/index.html'                                                     
    res.writeHead(200, {"Content-Type": "text/html"});                                                 
    fs.createReadStream(file).pipe(res);                        
}); 

router.get('/hi', function(req, res) {
    res.json({ message: "HI! API!" });
});

// get all the gmsdata (accessed at GET http://localhost:9999/api/gmsdata)
router.get('/gmsdata', function(req, res) {
        Gmsdata.find(function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json(gmsdata);
        });
});

// update single gmsdata (accessed at GET http://localhost:9999/api/gmsdata:id)
router.put('/gmsdata/:id', function(req, res) {
        // use our Gmsdata model to find the bear we want
        Gmsdata.findById(req.params.id, function(err, gmsdata) {

            if (err)
                res.send(err);

            gmsdata.name = req.query.name;  // update the bears info

            // save the bear
            gmsdata.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Gmsdata updated!' });
            });

        });
});

// delete single gmsdata (accessed at GET http://localhost:9999/api/gmsdata:id)
router.delete('/gmsdata/inner/:id', function(req, res) {
        Gmsdata.remove({
            _id: req.params.id
        }, function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
});

// delete single gmsdata (accessed at GET http://localhost:9999/api/gmsdata:id)
router.delete('/gmsdata/deleteAll', function(req, res) {
        Gmsdata.remove({}, function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted all' });
        });
});

// ===========pano_id===============
// get single gmsdata (accessed at GET http://localhost:9999/api/gmsdata:pano_id)
router.get('/gmsdata/pano_id=:pano_id&x=:x&y=:y', function(req, res) {

    var pano_id = req.params.pano_id;
    var x = req.params.x;
    var y = req.params.y;

    var imageData;
    var img;

    Gmsdata.find({pano_id: pano_id, x: x, y: y}, function(err, gmsdata) {
        if (err) 
            res.json({ message: 'Find error!' });

        if (gmsdata.length == 0) {
            console.log('Request to Google...');

            var gmsdata = new Gmsdata();      // create a new instance of the gmsdata model
            gmsdata.pano_id = pano_id;  // set the gmsdata name (comes from the request)
            gmsdata.x = x;
            gmsdata.y = y;

            // retreive from Goolde for loss data and save to DB
            request_gmsdata(pano_id, x, y, function (data, err) {
                if (err == null) {

                    gmsdata.data = data;

                    // save the gmsdata and check for errors
                    gmsdata.save(function(err) {
                        if (err)
                            res.json({ message: 'Save error!' });
                        else {
                            imageData = data;
                            img = new Buffer(imageData, 'base64');
                            res.writeHead(200, {
                                'Content-Type': 'image/png',
                                'Content-Length': img.length
                            });
                            res.end(img);
                        }
                    });
                } else { res.json({ message: err }); }
            });

        } else {
            imageData = gmsdata[0].data;
            img = new Buffer(imageData, 'base64');

            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img);
            
        }
         
    });
});

// create a gmsdata (accessed at POST http://localhost:9999/api/gmsdata)
router.post('/gmsdata', function(req, res) {
        var gmsdata = new Gmsdata();      // create a new instance of the gmsdata model
        gmsdata.pano_id = req.query.pano_id;  // set the gmsdata name (comes from the request)
        gmsdata.x = req.query.x;
        gmsdata.y = req.query.y;

        // retreive from Goolde for loss data and save to DB
        request_gmsdata(gmsdata.pano_id, gmsdata.x, gmsdata.y, function (data, err) {
            if (err == null) {

                gmsdata.data = data;

                // save the gmsdata and check for errors
                gmsdata.save(function(err) {
                    if (err)
                        res.json({ message: 'Save error!' });
                    else {
                        res.json({ message: 'Data created!' });
                    }
                });
            } else { res.json({ message: err }); }
        });

});

// delete single gmsdata (accessed at GET http://localhost:9999/api/gmsdata:pano_id)
router.delete('/gmsdata/:pano_id', function(req, res) {
        Gmsdata.remove({
            pano_id: req.params.pano_id
        }, function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
});

function request_gmsdata(pano_id, x, y, callback) {
    var aUrl = 'http://maps.google.com/cbk?output=tile&panoid=' + pano_id + '&zoom=5&x=' + x + '&y=' + y + '&20161019';
        request.get(aUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = new Buffer(body).toString('base64');
                callback(data, null);
            } else {
                callback(null, 'Request google error');
            }
        });
}

module.exports = router;