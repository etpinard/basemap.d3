var fs = require('fs'),
    wget = require('wget'),
    exec = require('child_process').exec;

var common = require('./common');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if(err) throw err;

    var config = JSON.parse(configFile);

    if(!fs.existsSync(config.wget_dir)) fs.mkdirSync(config.wget_dir);

    var bar = common.makeBar(
        'Downloading shapefiles: [:bar] :current/:total',
        [config.resolutions, config.vectors]
    );

    function unzip(r, v) {
        return [
            "unzip",
            config.wget_dir + config.src_prefix + common.bn(r, v.src, 'zip'),
            "-d", config.wget_dir
        ].join(' ');
    }

    config.resolutions.forEach(function(r) {
        config.vectors.forEach(function(v) {

            var url = [
                    config.urlbase,
                    r, 'm/', v.type + '/',
                    config.src_prefix,
                    common.bn(r, v.src, 'zip')
                ].join(''),
                out = [
                    config.wget_dir,
                    config.src_prefix,
                    common.bn(r, v.src, 'zip')
                ].join('');

            var download = wget.download(url, out, {});

            download.on('error', function(error) {
                console.log(error);
            });

            download.on('end', function(output) {
                bar.tick();
                exec(unzip(r, v));
            });

        });
    });
}
