var fs = require('fs'),
    unzip = require('unzip'),
    exec = require('child_process').exec,
    ProgressBar = require('progress');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if (err) throw err;

    var config = JSON.parse(configFile);

    var bar = new ProgressBar(
        'Converting Natural Earth shapefiles to GeoJSON: [:bar] :current/:total :etas',
        {
            incomplete: ' ',
            total: config.resolutions.length * config.vectors.length
        }
    );

    function bn(r, v, ext) {
        return config.src_prefix + r + 'm_' + v.src + '.' + ext;
    }

    function fn(r, v, ext) {
        return v.name + '_' + r + 'm.' + ext;
    }

    function ogr2ogr(r, v) {
        return [
            "ogr2ogr -f GeoJSON",
            config.wget_dir + fn(r, v, 'json'),
            config.wget_dir + bn(r, v, 'shp')
       ].join(' ');
    }

    config.resolutions.forEach(function(r) {
        config.vectors.forEach(function(v) {

            var unzipper = fs.createReadStream(config.wget_dir + bn(r, v, 'zip'))
                             .pipe(unzip.Extract({ path: config.wget_dir }));

            unzipper.on('finish', function() {
                exec(ogr2ogr(r, v), function() {
                    bar.tick();
                });
            });

        });
    });

}
