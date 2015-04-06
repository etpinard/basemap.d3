var map = {};

// Enable debug mode:
// - boundary around fullLayout.width / height
// - boundary around rangeBox polygon (used to determine projection scale)
map.DEBUG = false;

// Print gd.data and gd.layout to DOM
map.PRINT = true;

// -------------------------------------------------------------------------------

// projection names to d3 function name
map.PROJNAMES = {
    // d3.geo.projection
    'equirectangular': 'equirectangular',
    'mercator': 'mercator',
    'azimuthal-equal-area': 'azimuthalEqualArea',
    'azimuthal-equidistant': 'azimuthalEquidistant',
    'conic-equal-area': 'conicEqualArea',
    'conic-conformal': 'conicConformal',
    'conic-equidistant': 'conicEquidistant',
    'gnomonic': 'gnomonic',
    'stereographic': 'stereographic',
    'orthographic': 'orthographic',
    'transverse-mercator': 'transverseMercator',
    'albers-usa': 'albersUsa',
    // d3.geo.projection plugin
    'kavrayskiy7': 'kavrayskiy7'
};

// max longitudinal angular span
map.LONSPAN = {
    '*': 360,
    'orthographic': 180,
    'azimuthal-equal-area': 360,
    'azimuthal-equidistant': 360,
    'gnomonic': 160,  // TODO appears to make things work; is this correct?
    'stereographic': 360
};

// max latitudinal angular span
map.LATSPAN = {
    '*': 180,
    'conic-conformal': 150  // TODO appears to make things work; is this correct?
};

map.DFLTLONRANGE = {
    world: [-180, 180],
    usa: [-180, -50],
    europe: [-30, 60],
    asia: [22, 160],
    africa: [-30, 60],
    'north-america': [-180, -45],
    'south-america': [-100, -30]
};

map.DFLTLATRANGE = {
    world: [-90, 90],
    usa: [15, 80],
    europe: [30, 80],
    asia: [-15, 55],
    africa: [-40, 40],
    'north-america': [5, 85],
    'south-america': [-60, 15]
};

// angular pad to avoid rounding error around clip angles
map.CLIPPAD = 1e-3;

// map projection precision
map.PRECISION = 0.1;

// -------------------------------------------------------------------------------

map.coerce = function coerce(containerIn, containerOut, astr, dflt) {
    if (!(astr in containerIn)) {
        containerOut[astr] = dflt;
    }
    else {
        containerOut[astr] = containerIn[astr];
    }
    return containerOut[astr];
};

map.coerceNest = function coerceNest(containerIn, containerOut, nest, astr, dflt) {
    if (!(nest in containerIn)) containerIn[nest] = {};
    if (!(nest in containerOut)) containerOut[nest] = {};
    return map.coerce(containerIn[nest], containerOut[nest], astr, dflt);
};

map.supplyLayoutDefaults = function supplyLayoutDefaults(gd) {
    var layout = gd.layout,
        fullLayout = {},
        mapLayout = layout.map,
        mapFullLayout = {};

    function coerce(astr, dflt) {
        return map.coerce(layout, fullLayout, astr, dflt);
    }

    function coerceMap(astr, dflt) {
        return map.coerce(mapLayout, mapFullLayout, astr, dflt);
    }

    function coerceMapNest(nest, astr, dflt) {
        return map.coerceNest(mapLayout, mapFullLayout, nest, astr, dflt);
    }

    function isValidRange(layout, ax) {
        var axLayout = layout.map[ax];
        // TODO add isNumeric test
        return (axLayout &&
            'range' in axLayout) &&
            Array.isArray(axLayout.range) &&
            axLayout.range.length===2;
    }

    var autosizeDflt = false;
    if (layout.width && !layout.height) autosizeDflt = 'height';
    if (layout.height && !layout.width) autosizeDflt = 'width';
    coerce('autosize', autosizeDflt);

    coerce('width', 700);
    coerce('height', 450);

    coerceMap('domain', {x: [0, 1], y: [0, 1]});

    var scope = coerceMap('scope', 'world');

    var resolution = coerceMap('resolution',
        scope==='world' ? '110m' : '50m');

    var projType = coerceMapNest('projection', 'type', 'equirectangular');

    coerceMap('_topojson', scope + '_' + resolution);

    // TODO validate?
    // TODO add scope-specific defautls?
    // can yield weird results when rotate[0] is outline lonaxis.range
    var rotate = coerceMapNest('projection', 'rotate', [0, 0]);

    var lonSpan = (projType in map.LONSPAN) ?
            map.LONSPAN[projType] :
            map.LONSPAN['*'];

    var latSpan = (projType in map.LATSPAN) ?
            map.LATSPAN[projType] :
            map.LATSPAN['*'];

    // TODO expose to users
    var isClipped = coerceMapNest('projection', '_isClipped',
        (projType in map.LONSPAN));

    if (isClipped) coerceMapNest('projection', '_clipAngle',
         map.LONSPAN[projType] / 2);

    // TODO force 'showocean': false ,
    //            'showcoastlines': false and even
    //            'showgrid': false
    var isAlbersUsa = coerceMapNest('projection', '_isAlbersUsa',
        projType==='albers-usa');

    // TODO implement 'rotate' or 'translate'
//     coerce('_panmode', (scope==='world' ? 'periodic': 'fixed'));

    // for conic projections
    if (projType.indexOf('conic')!==-1) {
        // same default as d3.geo['projection'].parallels
        coerceMapNest('projection', 'parallels', [0, 60]);
    }

    coerceMap('showcoastlines', (scope==='world'));
    coerceMap('coastlinescolor', 'black');
    coerceMap('coastlineswidth', 2);

    coerceMap('showland', false);
    coerceMap('landfillcolor', '#3B5323');

    coerceMap('showocean', false);
    coerceMap('oceanfillcolor', '#3399FF');

    coerceMap('showlakes', false);
    coerceMap('lakesfillcolor', '#3399FF');

    coerceMap('showrivers', false);
    coerceMap('riverslinecolor', '#3399FF');
    coerceMap('riverslinewidth', 1);

    coerceMap('showcountries', (scope!=='world'));
    coerceMap('countrieslinecolor', '#aaa');
    coerceMap('countrieslinewidth', 1.5);

    // USA states at 110m
    // USA states + Canada provinces at 50m
    coerceMap('showsubunits', false);
    coerceMap('subunitslinecolor', '#aaa');
    coerceMap('subunitslinewidth', 1);

    // TODO frame around lon/lat range and scope?
    //      maybe with d3.geo.graticule.lines?
    coerceMap('showframe', scope==='world');
    coerceMap('framelinecolor', 'black');
    coerceMap('framelinewidth', 2);

    coerceMapNest('projection', 'scale', 1);

    var autorange,
        halfSpan,
        fullRange;

    // lonaxis attributes
    autorange = coerceMapNest('lonaxis', 'autorange',
        !isValidRange(layout, 'lonaxis'));

    halfSpan = lonSpan / 2;
    fullRange = coerceMapNest('lonaxis', '_fullRange',
        scope==='world' ?
            [rotate[0] - halfSpan, rotate[0] + halfSpan] :
            map.DFLTLONRANGE[scope]);

    var lonRange = coerceMapNest('lonaxis', 'range', fullRange);

    coerceMapNest('lonaxis', 'showgrid', true);
    coerceMapNest('lonaxis', 'tick0', lonRange[0]);
    coerceMapNest('lonaxis', 'dtick', 30);
    coerceMapNest('lonaxis', 'gridcolor', '#777');
    coerceMapNest('lonaxis', 'gridwidth', 1);

    // lataxis attributes
    autosize = coerceMapNest('lataxis', 'autorange',
        !isValidRange(layout, 'lataxis'));

    halfSpan = latSpan / 2;
    fullRange = coerceMapNest('lataxis', '_fullRange',
        scope==='world' ?
            [rotate[1] - halfSpan, rotate[1] + halfSpan] :
            map.DFLTLATRANGE[scope]);

    var latRange = coerceMapNest('lataxis', 'range', fullRange);

    coerceMapNest('lataxis', 'showgrid', true);
    coerceMapNest('lataxis', 'tick0', latRange[0]);
    coerceMapNest('lataxis', 'dtick', 10);
    coerceMapNest('lataxis', 'gridcolor', '#777');
    coerceMapNest('lataxis', 'gridwidth', 1);

    // TODO add zeroline attributes

    fullLayout.map = mapFullLayout;
    gd._fullLayout = fullLayout;
};

map.supplyDefaults = function supplyDefaults(gd) {
    var data = gd.data,
        fullLayout = gd.fullLayout,
        Ntrace = data.length,
        fullData = new Array(Ntrace),
        trace,
        fullTrace,
        marker,
        fullMarker;

    function coerce(astr, dflt) {
        return map.coerce(trace, fullTrace, astr, dflt);
    }

    function coerceNest(nest, astr, dflt) {
        return map.coerceNest(trace, fullTrace, nest, astr, dflt);
    }

    function coerceMarkerNest(nest, astr, dflt) {
        return map.coerceNest(trace.marker, fullTrace.marker, nest, astr, dflt);
    }

    for (var i = 0; i < Ntrace; i++) {
        trace = data[i];
        fullTrace = {};
        fullMarker = {};

        coerce('type', 'map-scatter');

        coerce('lon', null);
        coerce('lat', null);
        coerce('z', null);
        coerce('loc', null);
        coerce('text', null);

        coerce('mode', 'markers');
        coerce('locmode', 'ISO-3');

        coerceNest('marker', 'size', 20);
        coerceNest('marker', 'color', 'rgb(255, 0, 0)');
        coerceNest('marker', 'symbol', 'circle');

        coerceMarkerNest('line', 'color', 'black');
        coerceMarkerNest('line', 'width', 2);

        coerceNest('line', 'color', 'rgb(0, 0, 255)');
        coerceNest('line', 'width', '4');

        fullData[i] = fullTrace;
    }

    gd._fullData = fullData;
};

map.doAutoRange = function doAutoRange(gd) {

    // TODO
    // based on data!

};

map.setConvert = function setConvert(gd) {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection,
        lonLayout = mapLayout.lonaxis,
        latLayout = mapLayout.lataxis,
        mapDomain = mapLayout.domain;

    var gs = fullLayout._gs = {};

    gs.l = 0;  // Math.round(ml);
    gs.r = 0;  // Math.round(mr);
    gs.t = 0;  // Math.round(mt);
    gs.b = 0;  // Math.round(mb);
    gs.p = 0;  // Math.round(fullLayout.margin.pad);
    gs.w = Math.round(fullLayout.width) - gs.l - gs.r;
    gs.h = Math.round(fullLayout.height) - gs.t - gs.b;

    // map width & height within domain (similar to axes.js)
    // TODO attach these to gs instead?
    lonLayout._length = gs.w * (mapDomain.x[1] - mapDomain.x[0]);
    latLayout._length = gs.h * (mapDomain.y[1] - mapDomain.y[0]);

    // offsets
    // TODO attach these to gs instead?
    lonLayout._offset = gs.l + mapDomain.x[0] * gs.w;
    latLayout._offset = gs.t + (1 - mapDomain.y[1]) * gs.h;

    // add padding around range to avoid aliasing
    var lon0 = lonLayout.range[0] + map.CLIPPAD,
        lon1 = lonLayout.range[1] - map.CLIPPAD,
        lat0 = latLayout.range[0] + map.CLIPPAD,
        lat1 = latLayout.range[1] - map.CLIPPAD;

    var lonfull0 = lonLayout._fullRange[0] + map.CLIPPAD,
        lonfull1 = lonLayout._fullRange[1] - map.CLIPPAD,
        latfull0 = latLayout._fullRange[0] + map.CLIPPAD,
        latfull1 = latLayout._fullRange[1] - map.CLIPPAD;

    // initial translation (makes the math in setScale easier)
    map.setTranslate = function setTranslate() {
        projLayout._translate = [
            gs.l + lonLayout._length / 2,
            gs.t + latLayout._length / 2
        ];
    };

    // is this more intuitive?
    map.setRotate = function setRotate() {
        var rotate = projLayout.rotate;
        projLayout._rotate = [
            -rotate[0],
            -rotate[1]
        ];
    };

    // center of the projection is given by
    // the lon/lat ranges and the rotate angle
    map.setCenter = function setCenter() {
        var dlon = lon1 - lon0,
            dlat = lat1 - lat0,
            c0 = [
                lon0 + dlon / 2,
                lat0 + dlat / 2
            ],
            r = projLayout._rotate;
        projLayout._center = [
            c0[0] + r[0],
            c0[1] + r[1]
        ];
    };

    // these don't need a projection; call them here
    map.setTranslate();
    map.setRotate();
    map.setCenter();

    // setScale needs a initial projection;
    // it is called from makeProjection
    map.setScale = function setScale(projection) {
        var scale0 = projection.scale(),
            autosize = fullLayout.autosize,
            scale,
            bounds,
            fullBounds;

        // Inspired by: http://stackoverflow.com/a/14654988/4068492
        // using the path determine the bounds of the current map and use
        // these to determine better values for the scale and translation

        // polygon GeoJSON corresponding to lon/lat range box
        // with well-defined direction
        function makeRangeBox(lon0, lat0, lon1, lat1) {
            var dlon4 = (lon1 - lon0) / 4,
                rangeBox;

            // TODO is this enough to handle ALL cases?
            // -- this makes scaling less precise than using d3.geo.graticule
            //    as great circles can overshoot the boundary
            //    (that's not a big deal I think)
            rangeBox = {
                type: "Polygon",
                coordinates: [
                  [ [lon0, lat0],
                    [lon0 , lat1],
                    [lon0 + dlon4, lat1],
                    [lon0 + 2 * dlon4, lat1],
                    [lon0 + 3 * dlon4, lat1],
                    [lon1, lat1],
                    [lon1, lat0],
                    [lon1 - dlon4, lat0],
                    [lon1 - 2 * dlon4, lat0],
                    [lon1 - 3 * dlon4, lat0],
                    [lon0, lat0] ]
                ]
            };

            return rangeBox;
        }

        // bounds array [[top, left], [bottom, right]]
        // of the lon/lat range box
        function getBounds(projection, rangeBox) {
            var path = d3.geo.path().projection(projection);
            return path.bounds(rangeBox);
        }

        function getScale(bounds) {
            function scaleFromWidth() {
                return scale0 * lonLayout._length / (bounds[1][0] - bounds[0][0]);
            }
            function scaleFromHeight() {
                 return scale0 * latLayout._length / (bounds[1][1] - bounds[0][1]);
            }

            if (autosize==='height') return scaleFromWidth();
            else if (autosize==='width') return scaleFromHeight();
            else return Math.min(scaleFromWidth(), scaleFromHeight());
        }

        var rangeBox = makeRangeBox(lon0, lat0, lon1, lat1);
            fullRangeBox = makeRangeBox(lonfull0, latfull0, lonfull1, latfull1);

        if (map.DEBUG) {
            map.rangeBox = rangeBox;
            map.fullRangeBox = fullRangeBox;
        }

        // scale projection given how range box get deformed
        // by the projection
        bounds = getBounds(projection, rangeBox);
        scale = getScale(bounds);

        // similarly, get scale at full range
        fullBounds = getBounds(projection, fullRangeBox);
        projLayout._fullScale = getScale(fullBounds);

        projection.scale(scale);

        // translate the projection so that the top-left corner
        // of the range box is at the top-left corner of the viewbox
        bounds = getBounds(projection, rangeBox);
        projection.translate([
            projLayout._translate[0] - bounds[0][0],
            projLayout._translate[1] - bounds[0][1]
        ]);

        // clip regions out of the range box
        // (these are clipping along horizontal/vertical lines)
        bounds = getBounds(projection, rangeBox);
        if (!projLayout._isAlbersUsa) {
            projection.clipExtent(bounds);
        }

        // effective width / height of container
        gs.wEff = Math.round(bounds[1][0]);
        gs.hEff = Math.round(bounds[1][1]);

        // copy auto-sized values to gs
        if (autosize==='height') gs.h = gs.hEff;
        else if (autosize==='width') gs.w = gs.wEff;

        // adjust scale one more time with the 'scale' attribute
        projection.scale(projLayout.scale * scale);

        // TODO add clipping along meridian/parallels option
        //      doable along meridian using projection.clipAngle!!!

    };

};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection,
        projType = projLayout.type,
        projection;

    projection = d3.geo[map.PROJNAMES[projType]]()
        .translate(projLayout._translate)
        .precision(map.PRECISION);

    if (!projLayout._isAlbersUsa) {
        projection
            .rotate(projLayout._rotate)
            .center(projLayout._center);
    }

    if (projLayout._isClipped) {
        projection.clipAngle(projLayout._clipAngle - map.CLIPPAD);
    }

    if (projLayout.parallels) {
        projection.parallels(projLayout.parallels);
    }

    map.setScale(projection);

    map.projection = projection;
};

map.isScatter = function(trace) {
    return (trace.type === "map-scatter");
};

map.isChoropleth = function(trace) {
    return (trace.type === "choropleth");
};

map.hasScatterMarkers = function(trace) {
    return (trace.type === "map-scatter" && trace.mode.indexOf('markers')!==-1);
};

map.hasScatterLines = function(trace) {
    return (trace.type === "map-scatter" && trace.mode.indexOf('lines')!==-1);
};

map.hasScatterText = function(trace) {
    return (trace.type === "map-scatter" && trace.mode.indexOf('text')!==-1);
};

map.makeCalcdata = function makeCalcdata(gd) {
    var fullData = gd._fullData,
        cd = new Array(fullData.length),
        cdi;

    function arrOrNum(x, i) {
        return Array.isArray(x) ? x[i] : x;
    }

    function getFromGeoJSON(trace) {
        var topo = map.topo,
            locmodeToLayer = {
                "ISO-3": "countries",
                "USA-states": "subunits"
            },
            layer = locmodeToLayer[trace.locmode],
            obj = topo.objects[layer];

        return {
            features: topojson.feature(topo, obj).features,
            ids: obj.properties.ids
        };
    }

    // don't project calcdata,
    // as projected calcdata need to be computed
    // on every drag or zoom event.

    function calcScatter(trace) {
        var marker = trace.marker,
            cdi = [],  // use push as cdi.length =< N
            N,
            getLonLat,
            lonlat;

        if (trace.loc) {
            var fromGeoJSON = getFromGeoJSON(trace),
                features = fromGeoJSON.features,
                ids = fromGeoJSON.ids,
                indexOfId;

            N = trace.loc.length;

            getLonLat = function(trace, j) {
                indexOfId = ids.indexOf(trace.loc[j]);
                if (indexOfId===-1) return;
                return features[indexOfId].properties.centroid;
            };
        }
        else {
            N = Math.min(trace.lon.length, trace.lat.length);

            getLonLat = function(trace, j) {
                return [trace.lon[j], trace.lat[j]];
            };
        }

        for (var j = 0; j < N; j++) {
            lonlat = getLonLat(trace, j);
            if (!lonlat) continue;
            cdi.push({
                lon: lonlat[0],
                lat: lonlat[1],
                ms: arrOrNum(marker.size, j),
                mc: arrOrNum(marker.color, j),
                mx: arrOrNum(marker.symbol, j),
                mlc: arrOrNum(marker.line.color, j),
                mlw: arrOrNum(marker.line.width, j),
                tx: trace.text!==null ? trace.text[j] : ''
            });
        }

        return cdi;
    }

    function calcChoropleth(trace) {
        var N = trace.loc.length,
            fromGeoJSON = getFromGeoJSON(trace),
            features = fromGeoJSON.features,
            ids = fromGeoJSON.ids,
            cdi = [],  // use push as cdi.length =< N
            markerLine = trace.marker.line,
            indexOfId,
            feature;

        for (var j = 0; j < N; j++) {
            indexOfId = ids.indexOf(trace.loc[j]);
            if (indexOfId===-1) continue;

            feature = features[indexOfId];

            feature.z = trace.z[j];
            feature.mlc = arrOrNum(markerLine.color, j);
            feature.mlw = arrOrNum(markerLine.width, j);

            cdi.push(feature);
        }

        return cdi;
    }

    for (var i = 0; i < fullData.length; i++) {
        trace = fullData[i];

        if (map.isScatter(trace)) cdi = calcScatter(trace);
        if (map.isChoropleth(trace)) cdi = calcChoropleth(trace);

        cdi[0].trace = trace;
        cd[i] = cdi;
    }

    gd.calcdata = cd;
    return gd;
};

map.makeSVG = function makeSVG(gd) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._gs,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection;

    var isClipped = projLayout._isClipped,
        isAlbersUsa = projLayout._isAlbersUsa;

    var svg = d3.select(gd.div).select('div.plot-div')
      .append("svg")
        .attr("width", (map.DEBUG && gs.w > gs.wEff) ? gs.w : gs.wEff)
        .attr("height", (map.DEBUG && gs.h > gs.hEff) ? gs.h : gs.hEff);

    svg.append("g")
        .classed("basemap", true);

    svg.append("g")
        .classed("graticule", true);

    // TODO should 'frame' be drawn over 'graticule' ?

    svg.append("g")
        .classed("data", true);

    // [DEBUG] rectangle around svg container
    if (map.DEBUG) {
        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", gs.w)
            .attr("height", gs.h)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 6);

        svg.append("g")
            .datum(map.rangeBox)
          .append("path")
            .attr("d", d3.geo.path().projection(map.projection))
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 6);
    }

    var m0,  // variables for dragging
        o0,
        c0,
        t0;

    function handleZoomStart() {
        var projection = map.projection;

        m0 = [
            d3.event.sourceEvent.pageX,
            d3.event.sourceEvent.pageY
        ];

        if (projLayout._isAlbersUsa) {
            t0 = projection.translate();
        }
        else {
            var r = projection.rotate();
            o0 = [-r[0], -r[1]];
            c0 = projection.center();
        }

    }

    function handleZoom() {
        if (!m0) return;

        // pixel to degrees constant and minimum pixel distance
        var PXTODEGS = 3 * map.projection.scale() / projLayout._fullScale,
            MINPXDIS = 10;

        var m1 = [
                d3.event.sourceEvent.pageX,
                d3.event.sourceEvent.pageY
            ],
            dmx = Math.abs(m0[0]-m1[0]) < MINPXDIS ? 0 : (m0[0]-m1[0]) / PXTODEGS,
            dmy = Math.abs(m1[1]-m0[1]) < MINPXDIS ? 0 : (m1[1]-m0[1]) / PXTODEGS;

        function handleClipped() {
            // clipped projections are panned by rotation
            var o1 = [
                o0[0] + dmx,
                o0[1] + dmy
            ];
            map.projection.rotate([-o1[0], -o1[1]]);
        }

        function handleNonClipped() {
            // non-clipped projections are panned
            // by rotation along lon
            // and by translation along lat
            var o1 = [
                    o0[0] + dmx,
                    o0[1] + dmy
                ],
                c1 = [
                    c0[0] + dmx,
                    c0[1] + dmy
                ];

            map.projection.rotate([-o1[0], -o0[1]]);

            // tolerance factor for panning above/below latitude range
            var TOL = 0.75;

            var latLayout = mapLayout.lataxis,
                latRange = latLayout.range,
                latFullRange = latLayout._fullRange,
                cMin = Math.min(TOL * latRange[0], TOL * latFullRange[0]),
                cMax = Math.max(TOL * latRange[1], TOL * latFullRange[1]);

            // bound c[1] between [cMin, cMax]
            if (c1[1] > cMax) c1[1] = cMax;
            if (c1[1] < cMin) c1[1] = cMin;

            map.projection.center([c0[0], c1[1]]);
        }

        function handleAlbersUsa() {
            var t1 = [
                t0[0] + (m1[0] - m0[0]),
                t0[1] + (m1[1] - m0[1])
            ];
            map.projection.translate([t1[0], t1[1]]);
        }

        if (isClipped) handleClipped();
        else if (isAlbersUsa) handleAlbersUsa();
        else handleNonClipped();

    }

    var zoom = d3.behavior.zoom()
        .scale(map.projection.scale())
        .scaleExtent([
            // TODO is this good enough?
            0.5 * projLayout._fullScale,
            100 * projLayout._fullScale
        ])
        .on("zoomstart", function() {
            handleZoomStart();
        })
        .on("zoom", function() {
            map.projection.scale(d3.event.scale);
            handleZoom();
            map.drawPaths();
        })
        .on("zoomend", function() {
            // TODO do this on the highest resolution!
            // map.drawPaths();
        });

    var dblclick = function() {
        map.makeProjection(gd);
        zoom.scale(map.projection.scale());  // N.B. let the zoom event know!
        map.drawPaths();
    };

    // attach zoom and dblclick event to svg container
    svg
        .call(zoom)
        .on("dblclick.zoom", null)  // N.B. disable dblclick zoom default
        .on("dblclick", dblclick);

   return svg;
};

map.init = function init(gd) {
    var topo = map.topo,
        cd = gd.calcdata,
        fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        gBasemap,
        gGraticule,
        gData,
        gChoropleth,
        gBasemapOverChoropleth,
        hasChoropleth = false,
        i;

    map.fillLayers = ['ocean', 'land', 'lakes'];
    map.lineLayers = ['subunits', 'countries',
                      'coastlines', 'rivers', 'frame'];

    map.baselayers = map.fillLayers.concat(map.lineLayers);
    map.baselayersOverChoropleth = ['rivers', 'lakes'];

    // make SVG layers and attach events
    map.svg = map.makeSVG(gd);

    function plotBaseLayer(s, layer) {
        var datum;

        if (fullLayout.map['show' + layer]===true) {
            datum = (layer==='frame') ?
                {type: 'Sphere'} :
                topojson.feature(topo, topo.objects[layer]);

            s.append("g")
                .datum(datum)
                .attr("class", layer)
              .append("path")
                .attr("class", layer);
        }
    }

    // baselayers
    gBasemap = map.svg.select("g.basemap");
    for (i = 0;  i < map.baselayers.length; i++) {
        plotBaseLayer(gBasemap, map.baselayers[i]);
    }

    function plotGraticules(s) {
        var axes = ['lonaxis', 'lataxis'],
            lonLayout = mapLayout.lonaxis,
            latLayout = mapLayout.lataxis,
            graticule = {};

        function makeGraticule(step) {
            var scope = mapLayout.scope,
                lonRange = map.DFLTLONRANGE[scope],
                latRange = map.DFLTLATRANGE[scope];
            return d3.geo.graticule()
                .extent([
                    [lonRange[0], latRange[0]],
                    [lonRange[1], latRange[1]]
                ])
                .step(step);
        }

        function plotGraticule(axis) {
            s.append("path")
             .attr("class", axis + 'graticule')
             .datum(graticule[axis]);
        }

        if (lonLayout.showgrid) {
            graticule.lonaxis = makeGraticule([lonLayout.dtick]);
            plotGraticule('lonaxis');
        }

        if (latLayout.showgrid) {
            graticule.lataxis = makeGraticule([0, latLayout.dtick]);
            plotGraticule('lataxis');
        }
    }

    // graticule layers - should these be over choropleth?
    gGraticule = map.svg.select("g.graticule");
    plotGraticules(gGraticule);

    // bind calcdata to SVG
    gData = map.svg.select("g.data")
        .selectAll("g.trace")
        .data(cd)
      .enter().append("g")
        .attr("class", "trace");

    // choropleth
    gChoropleth = gData.append("g")
        .attr("class", "choropleth")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            if (!map.isChoropleth(trace)) s.remove();
            else {
                hasChoropleth = true;
                s.selectAll("path.choroplethloc")
                    .data(Object)
                .enter().append("path")
                  .attr("class", "choroplethloc");
            }
    });

    // some baselayers are drawn over choropleth
    if (hasChoropleth) {
        gBasemapOverChoropleth = gChoropleth.append("g")
            .attr("class", "basemapoverchoropleth");
        for (i = 0;  i < map.baselayersOverChoropleth.length; i++) {
            // delete existing baselayer
            gBasemap.select("." + map.baselayersOverChoropleth[i]).remove();
            // embed new baselayer into trace element
            plotBaseLayer(gBasemapOverChoropleth,
                          map.baselayersOverChoropleth[i]);
        }
    }

    // scatter lines
    gData.append("path")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            if (!map.hasScatterLines(trace)) s.remove();
            else {
                s.datum(map.makeLineGeoJSON(d))
                 .attr("class", "js-line");
            }
        });

    // scatter markers and text
    gData.append("g")
        .attr("class", "points")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace,
                showMarkers = map.hasScatterMarkers(trace),
                showText = map.hasScatterText(trace);

            if (!showMarkers && !showText) s.remove();
            else {
                if (showMarkers) {
                    s.selectAll("path.point")
                        .data(Object)
                      .enter().append("path")
                         .attr("class", "point");
                }
                if (showText) {
                    s.selectAll("g")
                        .data(Object)
                      .enter().append("g")
                        .append('text');
                }
            }
        });

    map.drawPaths();  // draw the paths for the first time
};

map.makeLineGeoJSON = function makeLineGeoJSON(d) {
    var N =  d.length,
        coordinates = new Array(N),
        di;
    for (var i = 0; i < N; i++) {
        di = d[i];
        coordinates[i] = [di.lon, di.lat];
    }
    return {
        type: "LineString",
        coordinates: coordinates,
        trace: d[0].trace
    };
};

// [hot code path] (re)draw all paths which depend on map.projection
map.drawPaths = function drawPaths() {
    var projection = map.projection,
        path = d3.geo.path().projection(projection);

    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection,
        isClipped = projLayout._isClipped,
        gData;

    function translatePoints(d) {
        var lonlat = projection([d.lon, d.lat]);
        if (!lonlat) return null;
        return "translate(" + lonlat[0] + "," + lonlat[1] + ")";
    }

    if (isClipped) {
        // hide paths over edges
        d3.selectAll("path.point")
            .attr("opacity", function(d) {
                var p = projection.rotate(),
                    angle = d3.geo.distance(
                        [d.lon, d.lat],
                        [-p[0], -p[1]]
                    ),
                    maxAngle = projLayout._clipAngle * Math.PI / 180;
                return (angle > maxAngle) ? "0" : "1.0";
            });
    }

    d3.selectAll("g.basemap path")
        .attr("d", path);
    d3.selectAll("g.graticule path")
        .attr("d", path);

    gData = map.svg.select("g.data");
    gData.selectAll("path.choroplethloc")
        .attr("d", path);
    gData.selectAll("g.basemapoverchoropleth path")
        .attr("d", path);
    gData.selectAll("path.js-line")
        .attr("d", path);
    gData.selectAll("path.point")
        .attr("transform", translatePoints);
    gData.selectAll("text")
        .attr("transform", translatePoints);
};

map.pointStyle = function pointStyle(s, trace) {
    var marker = trace.marker,
        symbols = {
            circle: function(r) {
                var rs = d3.round(r,2);
                return 'M'+rs+',0A'+rs+','+rs+' 0 1,1 0,-'+rs+
                    'A'+rs+','+rs+' 0 0,1 '+rs+',0Z';
            },
            square: function(r) {
                var rs = d3.round(r,2);
                return 'M'+rs+','+rs+'H-'+rs+'V-'+rs+'H'+rs+'Z';
            }
            // ... more to come ...
        };

    s.each(function(d) {
        d3.select(this)
            .attr("fill", d.mc || marker.color)
            .attr("stroke", d.mlc || marker.line.color)
            .attr("stroke-width", d.mlw || marker.line.width);
    });

    s.attr('d', function(d){
        var r = (d.ms+1) ? d.ms/2 : marker.size/2;
        return symbols[d.mx || marker.symbol](r);
    });

};

map.lineStyle = function lineStyle(s) {
    s.style('fill', 'none')
        .each(function(d) {
            var line = d.trace.line;
            d3.select(this)
                .attr("stroke", line.color)
                .attr("stroke-width", line.width);
        });
};

map.textPointStyle = function textPointStyle(s, trace) {
    s.each(function(d) {
        d3.select(this)
            .style('font-size', '14px')
            .text(d.tx)
            .attr('text-anchor', 'middle');
    });
};

map.style = function style(gd) {
    var mapLayout = gd._fullLayout.map;

    map.fillLayers.forEach(function(layer){
        d3.select("path." + layer)
            .attr("stroke", "none")
            .attr("fill", mapLayout[layer + 'fillcolor']);
    });

    map.lineLayers.forEach(function(layer){
        var s = d3.select("path." + layer);

        // coastline is an exception
        if (layer!=='coastlines') layer += 'line';

        s.attr("fill", "none")
         .attr("stroke", mapLayout[layer + 'color'])
         .attr("stroke-width", mapLayout[layer + 'width']);
    });

    ['lonaxis', 'lataxis'].forEach(function(ax){
        var s = d3.select("path." + ax + "graticule");

        s.attr("fill", "none")
         .attr("stroke", mapLayout[ax].gridcolor)
         .attr("stroke-width", mapLayout[ax].gridwidth)
         .attr("stroke-opacity", 0.5);  // TODO generalize
    });

    // TODO generalize
    var colorscale = d3.scale.log()
        .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
        .interpolate(d3.interpolateHcl);

    d3.selectAll("g.choropleth")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            // TODO generalize (bis)
            colorscale.domain([d3.quantile(trace.z, 0.01),
                               d3.quantile(trace.z, 0.99)]);

            s.selectAll("path.choroplethloc")
                .each(function(d) {
                    var s  = d3.select(this);
                    s.attr("fill", function(d) { return colorscale(d.z); })
                     .attr("stroke", d.mlc || marker.line.color)
                     .attr("stroke-width", d.mlw || marker.line.width);
                });
        });

    d3.selectAll("g.trace path.js-line")
        .call(map.lineStyle);

    d3.selectAll("g.points")
        .each(function(d) {
            d3.select(this).selectAll("path.point")
                .call(map.pointStyle, d.trace || d[0].trace);
            d3.select(this).selectAll("text")
                .call(map.textPointStyle, d.trace || d[0].trace);
        });
};

map.plot = function plot(gd) {

    gd.div = Print.init();

    map.supplyLayoutDefaults(gd);
    map.supplyDefaults(gd);
    map.doAutoRange(gd);

    map.setConvert(gd);
    map.makeProjection(gd);

    var topojsonPath = "../raw/" + gd._fullLayout.map._topojson + ".json";

    d3.json(topojsonPath, function(error, topo) {

        map.topo = topo;
        map.makeCalcdata(gd);

        map.init(gd);
        map.style(gd);

        if (map.PRINT) Print.printToDOM(gd);
        else Print.removeCodeDiv(gd);

    });

};
