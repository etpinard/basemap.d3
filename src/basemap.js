var Basemap = {};

// Enable debug mode:
// - boundary around fullLayout.width / height
// - boundary around rangeBox polygon (used to determine projection scale)
Basemap.DEBUG = false;

// Print gd.data and gd.layout to DOM
Basemap.PRINT = true;

// -------------------------------------------------------------------------------

// projection names to d3 function name
Basemap.PROJNAMES = {
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
Basemap.LONSPAN = {
    '*': 360,
    'orthographic': 180,
    'azimuthal-equal-area': 360,
    'azimuthal-equidistant': 360,
    'gnomonic': 160,  // TODO appears to make things work; is this correct?
    'stereographic': 360
};

// max latitudinal angular span
Basemap.LATSPAN = {
    '*': 180,
    'conic-conformal': 150  // TODO appears to make things work; is this correct?
};

Basemap.DFLTLONRANGE = {
    world: [-180, 180],
    usa: [-180, -50],
    europe: [-30, 60],
    asia: [22, 160],
    africa: [-30, 60],
    'north-america': [-180, -45],
    'south-america': [-100, -30]
};

Basemap.DFLTLATRANGE = {
    world: [-90, 90],
    usa: [15, 80],
    europe: [30, 80],
    asia: [-15, 55],
    africa: [-40, 40],
    'north-america': [5, 85],
    'south-america': [-60, 15]
};

// angular pad to avoid rounding error around clip angles
Basemap.CLIPPAD = 1e-3;

// map projection precision
Basemap.PRECISION = 0.1;

// -------------------------------------------------------------------------------

Basemap.coerce = function coerce(containerIn, containerOut, astr, dflt) {
    if (!(astr in containerIn)) {
        containerOut[astr] = dflt;
    }
    else {
        containerOut[astr] = containerIn[astr];
    }
    return containerOut[astr];
};

Basemap.coerceNest = function coerceNest(containerIn, containerOut, nest, astr, dflt) {
    if (!(nest in containerIn)) containerIn[nest] = {};
    if (!(nest in containerOut)) containerOut[nest] = {};
    return Basemap.coerce(containerIn[nest], containerOut[nest], astr, dflt);
};

Basemap.supplyLayoutDefaults = function supplyLayoutDefaults(gd) {
    var layout = gd.layout,
        fullLayout = {},
        mapLayout = layout.map,
        mapFullLayout = {};

    function coerce(astr, dflt) {
        return Basemap.coerce(layout, fullLayout, astr, dflt);
    }

    function coerceMap(astr, dflt) {
        return Basemap.coerce(mapLayout, mapFullLayout, astr, dflt);
    }

    function coerceMapNest(nest, astr, dflt) {
        return Basemap.coerceNest(mapLayout, mapFullLayout, nest, astr, dflt);
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
    coerceMap('_isScoped', (scope!=='world'));

    var resolution = coerceMap('resolution',
        scope==='world' ? '110m' : '50m');
    coerceMap('_isHighRes', (resolution==='50m'));

    var projType = coerceMapNest('projection', 'type', 'equirectangular');

    coerceMap('_topojson', scope + '_' + resolution);

    // TODO validate?
    // TODO add scope-specific defautls?
    // can yield weird results when rotate[0] is outline lonaxis.range
    var rotate = coerceMapNest('projection', 'rotate', [0, 0]);

    var lonSpan = (projType in Basemap.LONSPAN) ?
            Basemap.LONSPAN[projType] :
            Basemap.LONSPAN['*'];

    var latSpan = (projType in Basemap.LATSPAN) ?
            Basemap.LATSPAN[projType] :
            Basemap.LATSPAN['*'];

    // TODO expose to users
    var isClipped = coerceMapNest('projection', '_isClipped',
        (projType in Basemap.LONSPAN));

    if (isClipped) coerceMapNest('projection', '_clipAngle',
         Basemap.LONSPAN[projType] / 2);

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
            Basemap.DFLTLONRANGE[scope]);

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
            Basemap.DFLTLATRANGE[scope]);

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

Basemap.supplyDefaults = function supplyDefaults(gd) {
    var data = gd.data,
        fullLayout = gd.fullLayout,
        Ntrace = data.length,
        fullData = new Array(Ntrace),
        trace,
        fullTrace,
        marker,
        fullMarker;

    function coerce(astr, dflt) {
        return Basemap.coerce(trace, fullTrace, astr, dflt);
    }

    function coerceNest(nest, astr, dflt) {
        return Basemap.coerceNest(trace, fullTrace, nest, astr, dflt);
    }

    function coerceMarkerNest(nest, astr, dflt) {
        return Basemap.coerceNest(trace.marker, fullTrace.marker, nest, astr, dflt);
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

Basemap.doAutoRange = function doAutoRange(gd) {

    // TODO
    // based on data!

};

Basemap.setConvert = function setConvert(gd) {
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
    var lon0 = lonLayout.range[0] + Basemap.CLIPPAD,
        lon1 = lonLayout.range[1] - Basemap.CLIPPAD,
        lat0 = latLayout.range[0] + Basemap.CLIPPAD,
        lat1 = latLayout.range[1] - Basemap.CLIPPAD;

    var lonfull0 = lonLayout._fullRange[0] + Basemap.CLIPPAD,
        lonfull1 = lonLayout._fullRange[1] - Basemap.CLIPPAD,
        latfull0 = latLayout._fullRange[0] + Basemap.CLIPPAD,
        latfull1 = latLayout._fullRange[1] - Basemap.CLIPPAD;

    // initial translation (makes the math)
    Basemap.setTranslate0 = function setTranslate0() {
        projLayout._translate0 = [
            gs.l + lonLayout._length / 2,
            gs.t + latLayout._length / 2
        ];
    };

    // is this more intuitive?
    Basemap.setRotate = function setRotate() {
        var rotate = projLayout.rotate;
        projLayout._rotate = [
            -rotate[0],
            -rotate[1]
        ];
    };

    // center of the projection is given by
    // the lon/lat ranges and the rotate angle
    Basemap.setCenter = function setCenter() {
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
    Basemap.setTranslate0();
    Basemap.setRotate();
    Basemap.setCenter();

    // setScale needs a initial projection;
    // it is called from makeProjection
    Basemap.setScale = function setScale(projection) {
        var scale0 = projection.scale(),
            translate0 = projLayout._translate0,
            autosize = fullLayout.autosize,
            scale,
            translate,
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

        if (Basemap.DEBUG) {
            Basemap.rangeBox = rangeBox;
            Basemap.fullRangeBox = fullRangeBox;
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
        translate = [
            translate0[0] - bounds[0][0],
            translate0[1] - bounds[0][1]
        ];
        projLayout._translate = translate;
        projection.translate(translate);

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
        scale = projLayout.scale * scale;

        // set projection scale and save it
        projLayout._scale = scale;

        // TODO add clipping along meridian/parallels option
        //      doable along meridian using projection.clipAngle!!!

    };

};

Basemap.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection,
        projType = projLayout.type,
        isNew = !('projection' in Basemap),
        projection;

    if (isNew) projection = d3.geo[Basemap.PROJNAMES[projType]]();
    else projection = Basemap.projection;

    projection
        .translate(projLayout._translate0)
        .precision(Basemap.PRECISION);

    if (!projLayout._isAlbersUsa) {
        projection
            .rotate(projLayout._rotate)
            .center(projLayout._center);
    }

    if (projLayout._isClipped) {
        projection
            .clipAngle(projLayout._clipAngle - Basemap.CLIPPAD);
    }

    if (projLayout.parallels) {
        projection
            .parallels(projLayout.parallels);
    }

    if (isNew) Basemap.setScale(projection);
    projection
        .translate(projLayout._translate)
        .scale(projLayout._scale);

    Basemap.projection = projection;
};

Basemap.makePath = function makePath() {
    Basemap.path = d3.geo.path().projection(Basemap.projection);
};

Basemap.isScatter = function(trace) {
    return (trace.type === "map-scatter");
};

Basemap.isChoropleth = function(trace) {
    return (trace.type === "choropleth");
};

Basemap.hasScatterMarkers = function(trace) {
    return (trace.type === "map-scatter" && trace.mode.indexOf('markers')!==-1);
};

Basemap.hasScatterLines = function(trace) {
    return (trace.type === "map-scatter" && trace.mode.indexOf('lines')!==-1);
};

Basemap.hasScatterText = function(trace) {
    return (trace.type === "map-scatter" && trace.mode.indexOf('text')!==-1);
};

Basemap.makeCalcdata = function makeCalcdata(gd) {
    var fullData = gd._fullData,
        cd = new Array(fullData.length),
        cdi;

    function arrOrNum(x, i) {
        return Array.isArray(x) ? x[i] : x;
    }

    function getFromGeoJSON(trace) {
        var topo = Basemap.topo,
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

        if (Basemap.isScatter(trace)) cdi = calcScatter(trace);
        if (Basemap.isChoropleth(trace)) cdi = calcChoropleth(trace);

        cdi[0].trace = trace;
        cd[i] = cdi;
    }

    gd.calcdata = cd;
    return gd;
};

Basemap.makeSVG = function makeSVG(gd) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._gs;

    var svg = d3.select(gd.div).select('div.plot-div')
      .append("svg")
        .attr("width", (Basemap.DEBUG && gs.w > gs.wEff) ? gs.w : gs.wEff)
        .attr("height", (Basemap.DEBUG && gs.h > gs.hEff) ? gs.h : gs.hEff);

    svg.append("g")
        .classed("basemap", true);

    svg.append("g")
        .classed("graticule", true);

    // TODO should 'frame' be drawn over 'graticule' ?

    svg.append("g")
        .classed("data", true);

    // [DEBUG] rectangle around svg container
    if (Basemap.DEBUG) {
        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", gs.w)
            .attr("height", gs.h)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 6);

        svg.append("g")
            .datum(Basemap.rangeBox)
          .append("path")
            .attr("d", Basemap.path)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 6);
    }

    // instantiate handleZoom constructor
    var handleZoom = new Basemap.handleZoom(),
        fullScale = fullLayout.map.projection._fullScale;

    var zoom = d3.behavior.zoom()
        .translate(Basemap.projection.translate())
        .scale(Basemap.projection.scale())
        .scaleExtent([
            // TODO is this good enough?
            0.5 * fullScale,
            100 * fullScale
        ])
        .on("zoomstart", handleZoom.zoomstart)
        .on("zoom", handleZoom.zoom)
        .on("zoomend", handleZoom.zoomend);

    var dblclick = function() {
        Basemap.makeProjection(gd);
        Basemap.makePath();
        zoom.scale(Basemap.projection.scale());  // N.B. let the zoom event know!
        zoom.translate(Basemap.projection.translate());
        Basemap.drawPaths();
    };

    // attach zoom and dblclick event to svg container
    svg
        .call(zoom)
        .on("dblclick.zoom", null)  // N.B. disable dblclick zoom default
        .on("dblclick", dblclick);

   return svg;
};

Basemap.handleZoom = function handleZoom() {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection;

    var projection = Basemap.projection;

    var isClipped = projLayout._isClipped,
        isScoped = mapLayout._isScoped,
        isHighRes = mapLayout._isHighRes;

    var mouse0,
        rotate0,
        translate0,
        lastRotate,
        zoomPoint;

    function position(x) {
        return projection.invert(x);
    }

    this.zoomstart = function zoomstart() {
        d3.select(this).style('cursor', 'pointer');

        if (isScoped) return;

        mouse0 = d3.mouse(this);
        rotate0 = projection.rotate();
        translate0 = projection.translate();
        lastRotate = rotate0;
        zoomPoint = position(mouse0);
    };

    this.zoom = function zoom() {
        var mouse1 = d3.mouse(this);

        projection.scale(d3.event.scale);

        if (isScoped) {
            projection.translate(d3.event.translate);
            return;
        }

        function handleClipped() {
            // this algo is far from perfect.
            // scaling occur about the center of the view
            // (instead of about the cursor like the other algos)
            // the map doesn't follow the cursor perfectly
            // (unlike the other algos)
            // for a better version:
            // http://bl.ocks.org/alexcjohnson/bfef279fca09a6e3f8ba
            if (!mouse0) return;

            // pixel to degrees constant and minimum pixel distance
            var PXTODEGS = 3 * projection.scale() / projLayout._fullScale,
                MINPXDIS = 10;

           var dMouseInPx = [
               Math.abs(mouse0[0] - mouse1[0]) < MINPXDIS ?
                    0 :
                    (mouse0[0] - mouse1[0]) / PXTODEGS,
               Math.abs(mouse1[1] - mouse0[1]) < MINPXDIS ?
                    0 :
                    (mouse1[1] - mouse0[1]) / PXTODEGS
           ];

           projection.rotate([
               rotate0[0] - dMouseInPx[0],
               rotate0[1] - dMouseInPx[1]
           ]);
        }

        function handleNonClipped() {

            // TODO restrict d3.event.translate - how?
            projection.translate([
                translate0[0],
                d3.event.translate[1]
            ]);

            if (!zoomPoint) {
                mouse0 = mouse1;
                zoomPoint = position(mouse0);
            }
            else if (position(mouse1)) {
                var point1 = position(mouse1);
                var rotate1 = [
                    lastRotate[0] + (point1[0] - zoomPoint[0]),
                    rotate0[1]
                ];

                projection.rotate(rotate1);
                lastRotate = rotate1;
            }
        }


        if (isClipped) handleClipped();
        else handleNonClipped();

        Basemap.drawPaths();
    };

    this.zoomend = function zoomend() {
        d3.select(this).style('cursor', 'auto');
        if (!isHighRes) return;
        Basemap.drawPaths();

        // or something like
        //http://www.jasondavies.com/maps/gilbert/
    };

};

Basemap.init = function init(gd) {
    var topo = Basemap.topo,
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

    Basemap.fillLayers = ['ocean', 'land', 'lakes'];
    Basemap.lineLayers = ['subunits', 'countries',
                      'coastlines', 'rivers', 'frame'];

    Basemap.baselayers = Basemap.fillLayers.concat(Basemap.lineLayers);
    Basemap.baselayersOverChoropleth = ['rivers', 'lakes'];

    // make SVG layers and attach events
    Basemap.svg = Basemap.makeSVG(gd);

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
    gBasemap = Basemap.svg.select("g.basemap");
    for (i = 0;  i < Basemap.baselayers.length; i++) {
        plotBaseLayer(gBasemap, Basemap.baselayers[i]);
    }

    function plotGraticules(s) {
        var axes = ['lonaxis', 'lataxis'],
            lonLayout = mapLayout.lonaxis,
            latLayout = mapLayout.lataxis,
            graticule = {};

        function makeGraticule(step) {
            var scope = mapLayout.scope,
                lonRange = Basemap.DFLTLONRANGE[scope],
                latRange = Basemap.DFLTLATRANGE[scope];
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
    gGraticule = Basemap.svg.select("g.graticule");
    plotGraticules(gGraticule);

    // bind calcdata to SVG
    gData = Basemap.svg.select("g.data")
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

            if (!Basemap.isChoropleth(trace)) s.remove();
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
        for (i = 0;  i < Basemap.baselayersOverChoropleth.length; i++) {
            // delete existing baselayer
            gBasemap.select("." + Basemap.baselayersOverChoropleth[i]).remove();
            // embed new baselayer into trace element
            plotBaseLayer(gBasemapOverChoropleth,
                          Basemap.baselayersOverChoropleth[i]);
        }
    }

    // scatter lines
    gData.append("path")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            if (!Basemap.hasScatterLines(trace)) s.remove();
            else {
                s.datum(Basemap.makeLineGeoJSON(d))
                 .attr("class", "js-line");
            }
        });

    // scatter markers and text
    gData.append("g")
        .attr("class", "points")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace,
                showMarkers = Basemap.hasScatterMarkers(trace),
                showText = Basemap.hasScatterText(trace);

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

    Basemap.drawPaths();  // draw the paths for the first time
};

Basemap.makeLineGeoJSON = function makeLineGeoJSON(d) {
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

// [hot code path] (re)draw all paths which depend on Basemap.projection
Basemap.drawPaths = function drawPaths() {
    var projection = Basemap.projection,
        path = Basemap.path;

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

    gData = Basemap.svg.select("g.data");
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

Basemap.pointStyle = function pointStyle(s, trace) {
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

Basemap.lineStyle = function lineStyle(s) {
    s.style('fill', 'none')
        .each(function(d) {
            var line = d.trace.line;
            d3.select(this)
                .attr("stroke", line.color)
                .attr("stroke-width", line.width);
        });
};

Basemap.textPointStyle = function textPointStyle(s, trace) {
    s.each(function(d) {
        d3.select(this)
            .style('font-size', '14px')
            .text(d.tx)
            .attr('text-anchor', 'middle');
    });
};

Basemap.style = function style(gd) {
    var mapLayout = gd._fullLayout.map;

    Basemap.fillLayers.forEach(function(layer){
        d3.select("path." + layer)
            .attr("stroke", "none")
            .attr("fill", mapLayout[layer + 'fillcolor']);
    });

    Basemap.lineLayers.forEach(function(layer){
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
        .call(Basemap.lineStyle);

    d3.selectAll("g.points")
        .each(function(d) {
            d3.select(this).selectAll("path.point")
                .call(Basemap.pointStyle, d.trace || d[0].trace);
            d3.select(this).selectAll("text")
                .call(Basemap.textPointStyle, d.trace || d[0].trace);
        });
};

Basemap.plot = function plot(gd) {

    gd.div = Print.init();

    Basemap.supplyLayoutDefaults(gd);
    Basemap.supplyDefaults(gd);
    Basemap.doAutoRange(gd);

    Basemap.setConvert(gd);
    Basemap.makeProjection(gd);
    Basemap.makePath();

    var topojsonPath = "../raw/" + gd._fullLayout.map._topojson + ".json";

    d3.json(topojsonPath, function(error, topo) {

        Basemap.topo = topo;
        Basemap.makeCalcdata(gd);

        Basemap.init(gd);
        Basemap.style(gd);

        if (Basemap.PRINT) Print.printToDOM(gd);
        else Print.removeCodeDiv(gd);

    });

};
