var map = {};

// Enable debug mode:
// - boundary around fullLayout.width / height
// - boundary around rangeBox polygon (used to determine projection scale)
map.DEBUG = false;

// Print gd.data and gd.layout to DOM
map.PRINT = true;

// -------------------------------------------------------------------------------

// max longitudinal angular span
map.LONSPAN = {};
map.LONSPAN.world = {
    '*': 360,
    orthographic: 180,
    azimuthalEqualArea: 360,
    azimuthalEquidistant: 360,
    gnomonic: 160,  // TODO appears to make things work; is this correct?
    stereographic: 360
};

// max latitudinal angular span
map.LATSPAN = {};
map.LATSPAN.world = {
    '*': 180,
    conicConformal: 150  // TODO appears to make things work; is this correct?
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

    coerce('width', 700);
    coerce('height', 450);

    coerceMap('domain', {x: [0, 1], y: [0, 1]});

    var scope = coerceMap('scope', 'world');
    var resolution = coerceMap('resolution', '110m');
    var projType = coerceMapNest('projection', 'type', 'equirectangular');

    coerceMap('_topojson', scope + '_' + resolution);

    var lonSpan = (projType in map.LONSPAN.world) ?
            map.LONSPAN.world[projType] :
            map.LONSPAN.world['*'];

    var latSpan = (projType in map.LATSPAN.world) ?
            map.LATSPAN.world[projType] :
            map.LATSPAN.world['*'];

    // TODO expose to users
    var isClipped = coerceMapNest('projection', '_isClipped',
        (projType in map.LONSPAN.world));

    if (isClipped) coerceMapNest('projection', '_clipAngle',
         map.LONSPAN.world[projType] / 2);

    // TODO implement 'rotate' or 'translate'
    coerce('_panmode', (scope==='world' ? 'periodic': 'fixed'));
    var rotate = coerceMapNest('projection', 'rotate', [0, 0]);

    // for conic projections
    coerceMapNest('projection', 'parallels', null);

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

    coerceMap('showsubunits', false);
    coerceMap('subunitslinecolor', '#aaa');
    coerceMap('subunitslinewidth', 1);

    coerceMap('showframe', true);
    coerceMap('framelinecolor', 'black');
    coerceMap('framelinewidth', 2);

    var autorange,
        halfSpan,
        fullRange;

    // lonaxis attributes
    autorange = coerceMapNest('lonaxis', 'autorange',
        !isValidRange(layout, 'lonaxis'));

    halfSpan = lonSpan / 2;
    fullRange = coerceMapNest('lonaxis', '_fullRange',
        [rotate[0] - halfSpan, rotate[0] + halfSpan]);

    var lonRange = coerceMapNest('lonaxis', 'range', fullRange);

    // TODO validate rotate given range

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
        [rotate[1] - halfSpan, rotate[1] + halfSpan]);

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
        mapDomain = mapLayout.domain,
        projLayout = mapLayout.projection,
        isClipped = projLayout._isClipped,
        lonLayout = mapLayout.lonaxis,
        latLayout = mapLayout.lataxis;

    var gs = fullLayout._gs = {};

    gs.l = 0;  // Math.round(ml);
    gs.r = 0;  // Math.round(mr);
    gs.t = 0;  // Math.round(mt);
    gs.b = 0;  // Math.round(mb);
    gs.p = 0;  // Math.round(fullLayout.margin.pad);
    gs.w = Math.round(fullLayout.width) - gs.l - gs.r;
    gs.h = Math.round(fullLayout.height) - gs.t - gs.b;

    // TODO use this instead of gs.w / gs.h
    lonLayout._length = gs.w * (mapDomain.x[1] - mapDomain.x[0]);
    latLayout._length = gs.h * (mapDomain.y[1] - mapDomain.y[0]);

    // TODO consider frame width into figure w/h

    // add padding at antemeridian to avoid aliasing
    // TODO this probably too crude in general
    var lon0 = lonLayout.range[0] + map.CLIPPAD,
        lon1 = lonLayout.range[1] - map.CLIPPAD,
        lat0 = latLayout.range[0] + map.CLIPPAD,
        lat1 = latLayout.range[1] - map.CLIPPAD;

    var lonfull0 = lonLayout._fullRange[0] + map.CLIPPAD,
        lonfull1 = lonLayout._fullRange[1] - map.CLIPPAD,
        latfull0 = latLayout._fullRange[0] + map.CLIPPAD,
        latfull1 = latLayout._fullRange[1] - map.CLIPPAD;

    // initial translation
    // TODO into merge setScale
    // with http://bl.ocks.org/phil-pedruco/9999984 ?
    map.setTranslate = function setTranslate() {
        projLayout._translate = [
            gs.l + gs.w / 2,
            gs.t + gs.h / 2
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
            // -- this makes scaling less precise as
            //    great circle overshoot the boundary
            rangeBox = {
                type: "Polygon",
                coordinates: [
                  [ [lon0, lat0],
                    [lon0 , lat1],
                    [lon0 + dlon4, lat1],
                    [lon0 + 2*dlon4, lat1],
                    [lon0 + 3*dlon4, lat1],
                    [lon1, lat1],
                    [lon1, lat0],
                    [lon1 - dlon4, lat0],
                    [lon1 - 2*dlon4, lat0],
                    [lon1 - 3*dlon4, lat0],
                    [lon0, lat0] ]
                ]
            };

            // or this, which might lead to better results
            // -- this messed up orthographic with rotate[1] = big
//              rangeBox = d3.geo.graticule()
//                 .extent([[lon0, lat0], [lon1, lat1]])
//                 .outline();

            return rangeBox;
        }

        // bounds array [[top, left], [bottom, right]]
        // of the lon/lat range box
        function getBounds(projection, rangeBox) {
            var path = d3.geo.path().projection(projection);
            return path.bounds(rangeBox);
        }

        function getScale(bounds) {
            return Math.min(
                scale0 * gs.w  / (bounds[1][0] - bounds[0][0]),
                scale0 * gs.h / (bounds[1][1] - bounds[0][1])
            );
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

        // TODO gnomonic
        // this projection is non-finite, should it just scale with width?
        // e.g. -> gs.w / (2 * Math.PI)

        // TODO scale is off for dflt range in:
        // stereographic, gnomonic

        // translate the projection so that the top-left corner
        // of the range box is at the top-left corner of the viewbox
        bounds = getBounds(projection, rangeBox);
        projection.translate([
            gs.w/2 - bounds[0][0],
            gs.h/2 - bounds[0][1]
        ]);

        // clip regions out of the range box
        // (these are clipping along horizontal/vertical lines)
        bounds = getBounds(projection, rangeBox);
        projection.clipExtent(bounds);

        // TODO latitude clipping is ill-defined for azimuthal projections

        // Effective width / height of container
        // TODO handle margin and domains?
        gs.wEff = Math.round(bounds[1][0]);
        gs.hEff = Math.round(bounds[1][1]);

        // TODO add clipping along meridian/parallels option

    };

};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection,
        projType = projLayout.type,
        projection;

    projection = d3.geo[projType]()
        .translate(projLayout._translate)
        .rotate(projLayout._rotate)
        .center(projLayout._center)
        .precision(map.PRECISION);

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
        projLayout = mapLayout.projection,
        isClipped = projLayout._isClipped;

    var svg = d3.select(gd.div).select('div.plot-div')
      .append("svg")
        .attr("width", map.DEBUG ? gs.w : gs.wEff)
        .attr("height", map.DEBUG ? gs.h : gs.hEff);

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
        t0,
        c0;

    function handleZoomStart() {
        var p = map.projection.rotate(),
            t = map.projection.translate(),
            c = map.projection.center();
        m0 = [
            d3.event.sourceEvent.pageX,
            d3.event.sourceEvent.pageY
        ];
        o0 = [-p[0], -p[1]];
        t0 = [t[0], t[1]];
        c0 = [c[0], c[1]];
    }

    function handleZoom() {
        if (!m0) return;

        var m1 = [
                d3.event.sourceEvent.pageX,
                d3.event.sourceEvent.pageY
            ],
            dmx = m0[0] - m1[0],
            dmy = m1[1] - m0[1],
            o1 = [
                o0[0] + dmx / 4,
                o0[1] + dmy / 4
            ],
            t1 = [  // TODO is this obsolete?
                t0[0] + dmx,
                t0[1] + dmy
            ],
            c1 = [
                c0[0] + dmx / 4,
                c0[1] + dmy / 4
            ];

        function handleClipped() {
            // clipped projections are panned by rotation
            map.projection.rotate([-o1[0], -o1[1]]);
        }

        function handleNonClipped() {
            // non-clipped projections are panned
            // by rotation along lon
            // and by translation along lat

            map.projection.rotate([-o1[0], -o0[1]]);

            // TODO Do all non-clipped projection have an inverse?
            // TODO Why does this give different results during pan?
//             var halfspan = map.projection.invert([0, map.bounds[1] / 2])[1]

            var latLayout = mapLayout.lataxis,
                latRange = latLayout.range,
                latFullRange = latLayout._fullRange,
                // TODO Is this good enough?
                cMin = Math.min(0.75 * latRange[0], 0.75 * latFullRange[0]),
                cMax = Math.max(0.75 * latRange[1], 0.75 * latFullRange[1]);

            if (c1[1] > cMax) c1[1] = cMax;
            if (c1[1] < cMin) c1[1] = cMin;

            map.projection.center([c0[0], c1[1]]);
        }

        if (isClipped) handleClipped();
        else handleNonClipped();

    }

    var zoom = d3.behavior.zoom()
        .scale(map.projection.scale())
        .scaleExtent([
            0.5 * projLayout._fullScale,
            10 * projLayout._fullScale  // TODO is this good enough?
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
            // map.drawPaths();  // TODO do this on the highest resolution!
        });

    var dblclick = function() {
        map.makeProjection(gd);
        zoom.scale(map.projection.scale());  // N.B. let the zoom event know!
        map.drawPaths();
    };

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
            // TODO something smarter for scopes
            return d3.geo.graticule()
                .extent([
                    [-180, -90],
                    [180, 90]
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
