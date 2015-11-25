var fs = require('fs'),
    exec = require('child_process').exec;

var common = require('./common');
var mapshaper = './node_modules/mapshaper/bin/mapshaper';

var DEBUG = false;  // logs commands if true

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if(err) throw err;

    var config = JSON.parse(configFile);
    var toposToWrite = common.getToposToWrite(config);

    var bar = common.makeBar(
        'Converting shapefiles to GeoJSON: [:bar] :current/:total',
        [toposToWrite, config.vectors]
    );

    function scopeBaseShapefile(r, s) {
        var specs = s.specs,
            filter,
            cmd;

        function getFilter(specs) {
            return [
                "'",
                "$.properties.",
                specs.key,
                " === ",
                "\"", specs.val, "\"",
                "'"
            ].join('');
        }

        filter = getFilter(specs);
        cmd = [
            mapshaper,
            config.wget_dir + config.src_prefix + common.bn(r, specs.src, 'shp'),
            "encoding=utf8",
            "-filter",
            filter,
            "-o",
            config.wget_dir + common.tn(r, s.name, specs.src, 'tmp.shp'),
            "force",
            "&&",
            "ogr2ogr",
            "-overwrite",
            "-clipsrc",
            specs.bounds.join(' '),
            config.wget_dir + common.tn(r, s.name, specs.src, 'shp'),
            config.wget_dir + common.tn(r, s.name, specs.src, 'tmp.shp')
       ].join(' ');

       if(DEBUG) console.log(cmd);
       return cmd;
    }

    function convertToGeoJSON(r, s, v, clip) {
        var specs = s.specs,
            cmd;

        // use ogr2ogr for clip around bound
        // use mapshaper for clip around shapefile polygons

        function getCmd(program, opt) {
            var cmd,
                expr;

            if(program==='ogr2ogr') {

                if(opt==='where') {
                    expr = [
                        '-where ',
                        "\"", specs.key, " IN ",
                        "('", specs.val, "')\" ",
                        '-clipsrc ',
                        specs.bounds.join(' ')
                    ].join('');
                }
                else if(opt==='clipsrc') {
                    expr = [
                        '-clipsrc ',
                        specs.bounds.join(' ')
                    ].join('');
                }
                else  expr = '';

                cmd = [
                    "ogr2ogr -f GeoJSON",
                    expr,
                    config.geojson_dir + common.tn(r, s.name, v.name, 'geo.json'),
                    config.wget_dir + config.src_prefix + common.bn(r, v.src, 'shp')
                ].join(' ');

            }
            else if(program==='mapshaper') {
                cmd = [
                    mapshaper,
                    config.wget_dir + config.src_prefix + common.bn(r, v.src, 'shp'),
                    "encoding=utf8",
                    "-clip",
                    config.wget_dir + common.tn(r, s.name, specs.src, 'shp'),
                    "-filter remove-empty",
                    "-o",
                    config.geojson_dir + common.tn(r, s.name, v.name, 'geo.json')
               ].join(' ');
            }

            return cmd;
        }

        if(clip && specs && specs.src!==v.name) {
            if(v.src===specs.src) {
                cmd = getCmd('ogr2ogr', 'where');
            }
            else if(s.name==='usa' && v.name==='rivers') {
                // for 'usa' scope,
                // clip rivers with base shp instead of bounds
                cmd = getCmd('mapshaper');
            }
            else if(v.scopeWith==='src') {
                cmd = getCmd('mapshaper');
            }
            else if(v.scopeWith==='bounds') {
                cmd = getCmd('ogr2ogr', 'clipsrc');
            }
        }
        else cmd = getCmd('ogr2ogr', false);

        if(DEBUG) console.log(cmd);
        return cmd;
    }

    function vectorLoop(r, s, clip) {
        config.vectors.forEach(function(v) {
            exec(convertToGeoJSON(r, s, v, clip), function() {
                bar.tick();
            });
        });
    }

    toposToWrite.forEach(function(topo) {
        var r = topo.r,
            s = topo.s;

        if(s.specs===false) vectorLoop(r, s, false);
        else {
            exec(scopeBaseShapefile(r, s), function() {
                vectorLoop(r, s, true);
            });
        }

    });

}
