var fs = require('fs'),
    ProgressBar = require('progress');

var common = module.exports = {};

// base file name
common.bn = function bn(r, v_name, ext) {
    return r + 'm_' + v_name + '.' + ext;
};

// temporary file name
common.tn = function tn(r, s_name, v_name, ext) {
    return r + 'm_' + s_name + '_' + v_name + '.' + ext;
};

// aggregated topojson
common.out = function out(r, s_name) {
    return s_name + '_' + r + 'm.json';
};

// make Progress bar
common.makeBar = function(str, components) {
    function getTotal() {
        var total = 1;
        components.forEach(function(c) {
            total *= c.length;
        });
        return total;
    }
    return new ProgressBar(
        str,
        {
            incomplete: ' ',
            total: getTotal()
        }
    );
};

// get list of topojsons to write
// (to update an existing topojson, delete it first)
common.getToposToWrite = function(config) {
    var toposToWrite = [];

    config.resolutions.forEach(function(r) {
        config.scopes.forEach(function(s) {
            var path = config.out_dir + common.out(r, s.name);
            if (!fs.existsSync(path)) {
                toposToWrite.push({r: r, s: s});
            }
        });
    });

    return toposToWrite;
};
