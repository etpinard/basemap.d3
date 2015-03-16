var fs = require('fs'),
    exec = require('child_process').exec;

var common = require('./common');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if (err) throw err;

    var config = JSON.parse(configFile);

    var bar = common.makeBar(
        'Converting shapefiles to GeoJSON: [:bar] :current/:total',
        [config.resolutions, config.vectors, config.scopes]
    );

    function scopeBaseShapefile(r, s) {
        var specs = s.specs,
            where;

        function getWhere(specs) {
            return [
                "-where \"", specs.key,
                " IN ",
                "('", specs.val, "')\""
            ].join('');
        }

        where = getWhere(specs);

        return [
            "ogr2ogr -overwrite",
            where,
            config.wget_dir + common.tn(r, s.name, specs.src, 'shp'),
            config.wget_dir + config.src_prefix + common.bn(r, specs.src, 'shp')
       ].join(' ');
    }

    function convertToGeoJSON(r, s, v, clip) {
        var specs = s.specs,
            opt;

        function getOpt(r, s, v, specs) {
            var key,
                val;

            if (v.src===specs.src) {
                key = '-where';
                val = ["\"", specs.key, " IN ", "('", specs.val, "')\""].join('');
            }
            else if (v.scopeWith==='src') {
                key = '-clipsrc';
                val = config.wget_dir + common.tn(r, s.name, specs.src, 'shp');
            }
            else if (v.scopeWith==='bounds') {
                key = '-clipsrc';
                val = specs.bounds.join(' ');
            }
            return [key, val].join(' ');
        }

        if (clip && specs && specs.src!==v.name) {
            opt = getOpt(r, s, v, specs);
        }
        else opt = '';

        return [
            "ogr2ogr -f GeoJSON",
            opt,
            config.wget_dir + common.tn(r, s.name, v.name, 'geo.json'),
            config.wget_dir + config.src_prefix + common.bn(r, v.src, 'shp')
        ].join(' ');
    }

    function vectorLoop(r, s, clip) {
        config.vectors.forEach(function(v) {
            exec(convertToGeoJSON(r, s, v, clip), function() {
                bar.tick();
            });
        });
    }

    config.resolutions.forEach(function(r) {
        config.scopes.forEach(function(s) {

            if (s.specs===false) {
                vectorLoop(r, s, false);
            }
            else {
                exec(scopeBaseShapefile(r, s), function() {
                    vectorLoop(r, s, true);
                });
            }

        });
    });

}
