var express = require('express');
var router = express.Router();
var Gmsdata = require('../app/models/gmsdata');
var Metadata = require('../app/models/metadata');
var Panorama = require('../app/models/panorama');

var fs = require('fs');
var request = require('request').defaults({ encoding: null });
var ejs = require('ejs');

var isGmsRequest = false;

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    //console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

router.get("/overview", function(req, res) {  
    var file = 'public/index.html'                                                     
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

// get counts of the gmsdata (accessed at GET http://localhost:9999/api/gmsdata)
router.get('/gmsdata/count', function(req, res) {
        Gmsdata.count(function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json(gmsdata);
        });
});


// delete single gmsdata (accessed at DELETE http://localhost:9999/api/gmsdata/inner/:id)
router.delete('/gmsdata/inner/:id', function(req, res) {
        Gmsdata.remove({
            _id: req.params.id
        }, function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
});

// delete all gmsdata (accessed at DELETE http://localhost:9999/api/gmsdata/deleteAll)
router.delete('/gmsdata/deleteAll', function(req, res) {
        Gmsdata.remove({}, function(err, gmsdata) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted all' });
        });
});

// ===========pano_id===============
// get single gmsdata tile (accessed at GET http://localhost:9999/api/gmsdata:pano_id)
router.get('/gmsdata/pano_id=:pano_id&zoom=:zoom&x=:x&y=:y', function(req, res) {

    var pano_id = req.params.pano_id;
    var x = req.params.x;
    var y = req.params.y;
    var zoom = req.params.zoom;

    var imageData;
    var img;

    Gmsdata.find({pano_id: pano_id, zoom: zoom, x: x, y: y}, function(err, gmsdata) {
        console.log('GET');
        if (err) 
            res.json({ message: 'Find error!' });

        if (gmsdata.length == 0) {

            var gmsdata = new Gmsdata();      // create a new instance of the gmsdata model
            gmsdata.pano_id = pano_id;  // set the gmsdata name (comes from the request)
            gmsdata.x = x;
            gmsdata.y = y;
            gmsdata.zoom = zoom;

            //retreive from Goolde for loss data and save to DB
            request_gmsdata_image(pano_id, zoom, x, y, function (data, err) {
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
                            isGmsRequest = false;
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
        gmsdata.zoom = req.query.zoom;

        // retreive from Goolde for loss data and save to DB
        request_gmsdata(gmsdata.pano_id, gmsdata.zoom, gmsdata.x, gmsdata.y, function (data, err) {
            if (err == null) {

                gmsdata.data = data;

                // save the gmsdata and check for errors
                gmsdata.save(function(err) {
                    if (err)
                        res.json({ message: 'Save error!' });
                    else {
                        res.json({ message: 'Data created!', content: data});
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

// ============metadata get by lcoation or pano_id============
// get all the metadata (accessed at GET http://localhost:9999/api/metadata)
router.get('/metadata', function(req, res) {
    console.log(req.ip);
        Metadata.find(function(err, metadata) {
            if (err)
                res.send(err);

            res.json(metadata);
        });
});

// get single metadata with pano_id (accessed at GET http://localhost:9999/api/metadata/pano_id=:pano_id), not cool
router.get('/metadata/pano_id=:pano_id', function(req, res) {
        Metadata.find({id: req.params.pano_id}, function(err, metadata) {
            if (err)
                res.send(err);

            if (metadata.length == 0) {
                var dataArr = [req.params.pano_id];
                res.render('test.ejs', {pano_id: dataArr});
            }

            res.json(metadata);
        });
});

// save metadata with json by pano_id (accessed at GET http://localhost:9999/api/metadata)
router.post('/metadata', function(req, res) {

    var json = req.body;
    console.log(json);
    
    var metadata = new Metadata();
    metadata.id = json.id;
    metadata.rotaion = json.rotaion;
    metadata.pitch = json.pitch;
    metadata.copyright = json.copyright;
    metadata.imageData = json.imageData;
    metadata.location = json.location;
    metadata.zoom = json.zoom;
    metadata.links = json.links;
    metadata.lat = json.lat;
    metadata.lng = json.lng;
    metadata.save(function(err) {
        if (err)
            res.json({ message: err });
        else {
            res.json({ message: 'Data created!' });
            }
    });
});

// delete single gmsdata (accessed at GET http://localhost:9999/api/gmsdata:id)
router.delete('/metadata/deleteAll', function(req, res) {
        Metadata.remove({}, function(err, metadata) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted all' });
        });
});

//===================get xml by pano_id==============================

// get whole image with pano_id (accessed at GET http://localhost:9999/api/panorama/pano_id=:pano_id), should not always use
router.get('/panorama/pano_id=:pano_id', function(req, res) {
    var dataArr = [req.params.pano_id];
    res.render('panoroma.ejs', {pano_id: dataArr});
});

// get xml data with pano_id (accessed at GET http://localhost:9999/api/panoramaXML/pano_id=:pano_id)
router.get('/panoramaXML/pano_id=:pano_id', function(req, res) {
    
    Panorama.find({pano_id: req.params.pano_id}, function(err, panorama) {
        if (err)
            res.send(err);

        if (panorama.length == 0) {
            
            var panorama = new Panorama();      // create a new instance of the gmsdata model
            panorama.pano_id = req.params.pano_id;  // set the gmsdata name (comes from the request)
            
            request_metadata_xml(panorama.pano_id, function(result, err) {
                if (err) {
                    console.log(err);
                }
                panorama.links = result;
                console.log(result);
                
                panorama.save(function(err) {
                    if (err)
                        res.json({ message: err });
                    else {
                        res.json({ message: 'Data created!', content: result});
                    }
                });
                
            });      
        } else {
            res.json(panorama);
        }
    }); 
});

// get xml data with latlng (accessed at GET http://localhost:9999/api/panoramaXML/pano_id=:pano_id)
router.get('/panoramaXML/lat=:lat&lng=:lng', function(req, res) {
        
    request_data_by_ll(req.params.lat, req.params.lng, function(result, err) {
        if (err != null) {
            res.json(err)
        } else {
            //res.json(result);
            var pano_id = result[0].pano_id;
            console.log(pano_id);

            Panorama.find({pano_id: pano_id}, function(err, panorama) {
                if (err)
                    res.send(err);

                if (panorama.length == 0) {

                    var panorama = new Panorama();      // create a new instance of the gmsdata model
                    panorama.pano_id = pano_id;  // set the gmsdata name (comes from the request)

                    request_metadata_xml(panorama.pano_id, function(result, err) {
                        if (err) {
                            console.log(err);
                        }
                        panorama.links = result;
                        console.log(result);

                        panorama.save(function(err) {
                            if (err)
                                res.json({ message: err });
                            else {
                                res.json({ message: 'Data created!', content: result});
                            }
                        });

                    });      
                } else {
                    res.json(panorama);
                }
            });
        }
    });
});

// get all xml data (accessed at GET http://localhost:9999/api/panoramaXML)
router.get('/panoramaXML', function(req, res) {
    
    Panorama.find({}, function(err, panorama) {
        if (err)
            res.send(err);
        res.json(panorama);
    }); 
});

// count all xml data (accessed at GET http://localhost:9999/api/panoramaXML/count)
router.get('/panoramaXML/count', function(req, res) {
    
    Panorama.count(function(err, number) {
        if (err)
            res.send(err);
        res.json(number);
    }); 
});

// delete all xml (accessed at GET http://localhost:9999/api/gmsdata:id)
router.delete('/panorama/deleteAll', function(req, res) {
        Panorama.remove({}, function(err, panorama) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted all panorama' });
        });
});

// get single metadata with latlng (accessed at GET http://localhost:9999/api/metadata/pano_id=:pano_id)
router.get('/metadata/lat=:lat&lng=:lng', function(req, res) {
    Metadata.find({lat: req.params.lat, lng: req.params.lng}, function(err, metadata) {
        if (err)
            res.send(err);

        if (metadata.length == 0) {
                
        }
        res.json(metadata);
    });
});


// ==================== self defined function ===================
function request_gmsdata_image(pano_id, zoom, x, y, callback) {

    while (!isGmsRequest) {
        isGmsRequest = true;
        console.log(x + ':' + y);
        console.log('Request to Google...');
        var aUrl = 'http://maps.google.com/cbk?output=tile&panoid=' + pano_id + '&zoom=' + zoom + '&x=' + x + '&y=' + y + '&20161019';
            request.get(aUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = new Buffer(body).toString('base64');
                    callback(data, null);
                } else {
                    callback(null, 'Request google error');
                }
        });
    }

}

function request_metadata_xml(pano_id, callback) {

    var xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    console.log('Request to Google...');
    var aUrl = 'http://maps.google.com/cbk?output=xml&panoid=' + pano_id;
    request.get(aUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            
            parser.parseString(body, function (err, result) {
                var links = result.panorama.annotation_properties[0].link;
                var datas = [];
                for (var i = 0; i < links.length; i++) {
                    datas.push(links[i].$);
                    //console.log(links[i].$);
                }
                callback(datas, null);
                
            });
            
            } else {
                callback(null, 'Request google error');
            }
    });

}

function request_data_by_ll(lat, lng, callback) { // not cool so far
    var xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    var aUrl = 'http://maps.google.com/cbk?output=xml&ll=' + lat + ',' + lng;
        request.get(aUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                
                parser.parseString(body, function (err, result) {
                    if (result.length > 0) {
                        var pano_id = result.panorama.data_properties[0].$.pano_id;
                        var links = result.panorama.annotation_properties[0].link;
                        var datas = [];
                        datas.push({"pano_id": pano_id});
                        for (var i = 0; i < links.length; i++) {
                            datas.push(links[i].$);
                        }
                        callback(datas, null);
                    }
                    else {
                        console.log("no panorama");
                        callback(null, 'no panorama');
                    }
                });
                
            } else {
                callback(null, 'Request google error');
            }
        });
}

module.exports = router;