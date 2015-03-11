var fs = require('fs'),
    topojson  = require('topojson'),
    gju = require('geojson-utils'),
    ProgressBar = require('progress');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if (err) throw err;

    var config = JSON.parse(configFile);

    var barWrite = new ProgressBar(
        'Writing into topojson: [:bar] :current/:total :etas',
        {
            incomplete: ' ',
            total: config.resolutions.length
        }
    );

    function fn(r, v, ext) {
        return v.name + '_' + r + 'm.' + ext;
    }

    function out(r) {
        return 'world_' + r + 'm.json';
    }

    // map all geojson properties to topojson
    function propertyTransform(feature) {
        return feature.properties;
    }

    config.resolutions.forEach(function(r) {
        var collections = {};

        var barRead = new ProgressBar(
            'Processing GeoJSON files : [:bar] :current/:total :etas',
            {
                incomplete: ' ',
                total: config.vectors.length
            }
        );

        config.vectors.forEach(function(v) {
            var d = fs.readFileSync(config.wget_dir + fn(r, v, 'json'), 'utf8'),
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

        fs.writeFile(config.out_dir + out(r), JSON.stringify(topology), function(err){
            if (!err) barWrite.tick();
        });

    });

}

function formatProperties(collection, v) {
    var features = collection.features,
        N = features.length,
        ids = new Array(N),
        feature,
        properties,
        id;

    function getCentroid(feature){
        var geometry = feature.geometry;

        function getOne(polygon) {
            return gju.centroid(polygon).coordinates;
        }

        if (geometry.type==='MultiPolygon') {
            var coordinates = geometry.coordinates,
                N = coordinates.length,
                sum = [0, 0],
                wsum = 0,
                polygon,
                c,
                a;

            for (var i = 0; i < N; i++) {
                polygon = {
                    type: "Polygon",
                    coordinates: coordinates[i]
                }
                c = getOne(polygon);
                a = gju.area(polygon);
                sum[0] += a * c[0];
                sum[1] += a * c[1];
                wsum += a;
            }

            return [sum[0] / wsum, sum[1] / wsum];
        }
        else if (geometry.type==='Polygon') {
            return getOne(geometry);
        }
        else return;
    }

    for (var i = 0; i < N; i++) {
        feature = features[i];

         if (v.ids) {
            // TODO generalize for ids.length > 1
            // TODO handle -99 ids
            id = feature.properties[v.ids[0]];

            ids[i] = id;
            feature.id = id;

            feature.properties = {
                centroid: getCentroid(feature)
            };
         }
    }

    if (v.ids) {
        collection.properties = {};
        collection.properties.ids = ids;
    }
}
