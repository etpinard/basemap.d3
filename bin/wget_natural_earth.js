var fs = require('fs'),
    wget = require('wget'),
    ProgressBar = require('progress');

fs.readFile('./bin/config.json', 'utf8', main);

function main(err, configFile) {
    if (err) throw err;

    var config = JSON.parse(configFile);

    if (!fs.existsSync(config.wget_dir)) fs.mkdirSync(config.wget_dir);

    var bar = new ProgressBar(
        'Downloading Natural Earth shapefiles: [:bar] :current/:total :etas',
        {
            incomplete: ' ',
            total: config.resolutions.length * config.vectors.length
        }
    );

    function bn(r, v, ext) {
        return config.src_prefix + r + 'm_' + v.src + '.' + ext;
    }

    config.resolutions.forEach(function(r) {
        config.vectors.forEach(function(v) {

            var url = [
                    config.urlbase,
                    r, 'm/', v.type + '/',
                    bn(r, v, 'zip')
                ].join(''),
                out = [
                    config.wget_dir,
                    bn(r, v, 'zip')
                ].join('');

            var download = wget.download(url, out, {});

            download.on('error', function(error) {
                console.log(error);
            });

            download.on('end', function(output) {
                bar.tick();
            });

        });
    });
}
