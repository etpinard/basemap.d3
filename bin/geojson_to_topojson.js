var fs = require('fs'),
    topojson  = require('topojson'),
    gju = require('geojson-utils');

var common = require('./common');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if(err) throw err;

    var config = JSON.parse(configFile);
    var toposToWrite = common.getToposToWrite(config);

    var barWrite = common.makeBar(
        'Writing into topojson: [:bar] :current/:total',
        [toposToWrite]
    );

    // map all geojson properties to topojson
    function propertyTransform(feature) {
        return feature.properties;
    }

    toposToWrite.forEach(function(topo) {
        var r = topo.r,
            s = topo.s;

        var collections = {};

        var barRead = common.makeBar(
            'Processing GeoJSON files : [:bar] :current/:total',
            [config.vectors]
        );

        config.vectors.forEach(function(v) {
            var path = config.geojson_dir + common.tn(r, s.name, v.name, 'geo.json'),
                d = fs.readFileSync(path, 'utf8'),
                collection = JSON.parse(d);

            formatProperties(collection, v);
            collections[v.name] = collection;

            barRead.tick();
        });

        // TODO experiment with simplification/quantization
        var topology = topojson.topology(collections, {
            'verbose': true,
            'property-transform': propertyTransform
         });

        var outPath = config.topojson_dir + common.out(r, s.name);

        fs.writeFile(outPath, JSON.stringify(topology), function(err){
            if(!err) barWrite.tick();
        });

    });

}

function formatProperties(collection, v) {
    var features = collection.features,
        N = features.length,
        feature,
        id;

    function getCentroid(feature){
        var geometry = feature.geometry;

        function getOne(polygon) {
            return gju.centroid(polygon).coordinates;
        }

        if(geometry.type==='MultiPolygon') {
            var coordinates = geometry.coordinates,
                N = coordinates.length,
                centroids = new Array(N),
                areas = new Array(N),
                polygon,
                indexOfMax;

            // compute one centroid per polygon and
            // pick the one associated with the
            // largest area.

            for(var i = 0; i < N; i++) {
                polygon = {
                    type: 'Polygon',
                    coordinates: coordinates[i]
                };
                centroids[i] = getOne(polygon);
                areas[i] = gju.area(polygon);
            }

            // 'min' works best, not sure why
            indexOfMax = areas.indexOf(Math.min.apply(Math, areas));
            return centroids[indexOfMax];
        }
        else if(geometry.type==='Polygon') {
            return getOne(geometry);
        }
        else return;
    }

    for(var i = 0; i < N; i++) {
        feature = features[i];

         if(v.ids) {
            // TODO generalize for ids.length > 1
            // TODO handle -99 ids
            id = feature.properties[v.ids];

            feature.id = id;
            feature.ct = getCentroid(feature);
            delete feature.properties;
         }
    }
}
