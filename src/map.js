var map = {};

// Enable debug mode:
// - boundary around fullLayout.width / height
// - boundary around rangeBox polygon (used to determine projection scale)
map.DEBUG = true;

// -------------------------------------------------------------------------------

// full angular span in degrees
map.SPANANGLE = {
    lonaxis: 360,
    lataxis: 180
};

// TODO angular span for scopes

// max angular span used to clip map layers
// (projections not listed get full angular span)
// TODO are these relevant only for lonaxis?
map.CLIPANGLE = {
    orthographic: 90,
    azimuthalEqualArea: 180,
    azimuthalEquidistant: 180,
    gnomonic: 90,
    stereographic: 180
};

// pad with respect to clip angles
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
    coerceMap('_topojson', scope + '_' + resolution);

    // TODO implement this!
    // 'rotate' or 'translate'
    coerce('_panmode', (scope==='world' ? 'periodic': 'fixed'));

    var projType = coerceMapNest('projection', 'type', 'equirectangular');
    var isClipped = coerceMapNest('projection', '_isClipped',
                                  (projType in map.CLIPANGLE));

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
        halfspan;

    // lonaxis attributes
    autorange = coerceMapNest('lonaxis', 'autorange',
                              !isValidRange(layout, 'lonaxis'));

    halfspan = (isClipped) ?
        map.CLIPANGLE[projType] :
        map.SPANANGLE['lonaxis'] / 2;
    coerceMapNest('lonaxis', '_halfspan', halfspan)
    var lonRange = coerceMapNest('lonaxis', 'range',
                                 [rotate[0] - halfspan, rotate[0] + halfspan]);

    // TODO validate range given rotate

    coerceMapNest('lonaxis', 'showgrid', true);
    coerceMapNest('lonaxis', 'tick0', lonRange[0]);
    coerceMapNest('lonaxis', 'dtick', 30);
    coerceMapNest('lonaxis', 'gridcolor', '#777');
    coerceMapNest('lonaxis', 'gridwidth', 1);

    // lataxis attributes
    autosize = coerceMapNest('lataxis', 'autorange',
                             !isValidRange(layout, 'lataxis'));

    halfspan = map.SPANANGLE['lataxis'] / 2;
    coerceMapNest('lataxis', '_halfspan', halfspan)
    var latRange = coerceMapNest('lataxis', 'range',
                                 [rotate[1] - halfspan, rotate[1] + halfspan]);

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
        lat1 = latLayout.range[1] - map.CLIPPAD,
        dlon = lon1 - lon0,
        dlat = lat1 - lat0;

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
        var c0 = [
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

    // setScale needs a initial projection; it is called from makeProjection
    map.setScale = function setScale(projection) {
        var scale0 = projection.scale(),
            bounds,
            scale;

        // TODO this actually depends on the projection!
        projLayout._fullScale = gs.w / (2 * Math.PI);

        // Inspired by: http://stackoverflow.com/a/14654988/4068492
        // using the path determine the bounds of the current map and use
        // these to determine better values for the scale and translation

        // TODO is this enough to handle ALL cases?
        var dlon4 = dlon / 4;

        // polygon GeoJSON corresponding to lon/lat range box
        // with well-defined direction
        var rangeBox = {
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

        if (map.DEBUG) map.rangeBox = rangeBox;

        // bounds array [[top,left] [bottom,right]]
        // of the lon/lat range box
        function getBounds(projection) {
            var path = d3.geo.path().projection(projection);
            return path.bounds(rangeBox);
        }

        // scale projection given how range box get deformed
        // by the projection
        bounds = getBounds(projection);
        scale  = Math.min(
            scale0 * gs.w  / (bounds[1][0] - bounds[0][0]),
            scale0 * gs.h / (bounds[1][1] - bounds[0][1])
        );
        projection.scale(scale);

        // TODO scale is off for gnomonic / stereographic / orthographic

        // translate the projection so that the top-left corner
        // of the range box is at the top-left corner of the viewbox
        bounds = getBounds(projection);
        projection.translate([
            gs.w/2 - bounds[0][0],
            gs.h/2 - bounds[0][1]
        ]);

        // clip regions out of the range box
        // (these are clipping along horizontal/vertical lines)
        bounds = getBounds(projection);
        projection.clipExtent(bounds);

        // TODO compute effective width / height with bounds
        // and use it for container width/height

        // TODO add clipping along meridian/parallels option

    };

};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        projLayout = fullLayout.map.projection,
        projType = projLayout.type,
        projection;

    projection = d3.geo[projType]()
        .translate(projLayout._translate)
        .rotate(projLayout._rotate)
        .center(projLayout._center)
        .precision(map.PRECISION);

    if (projType in map.CLIPANGLE) {
        projection.clipAngle(map.CLIPANGLE[projType] - map.CLIPPAD);
    }

    if (projLayout.parallels) {
        projection.parallels(projLayout.parallels);
    }

    // ... the big one!
    if (map._setScale===undefined) map.setScale(projection);

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
        projLayout = fullLayout.map.projection,
        isClipped = projLayout._isClipped;

    var svg = d3.select("body").append("svg")
        .attr("width", gs.w)
        .attr("height", gs.h);

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
            o1 = [
                o0[0] + (m0[0] - m1[0]) / 4,
                o0[1] + (m1[1] - m0[1]) / 4
            ],
            t1 = [
                t0[0] + (m0[0] - m1[0]),
                t0[1] + (m1[1] - m0[1])
            ],
            c1 = [
                c0[0] + (m0[0] - m1[0]) / 4,
                c0[1] + (m1[1] - m0[1]) / 4
            ];

        if (isClipped) {
            // clipped projections are panned by rotation
            map.projection.rotate([-o1[0], -o1[1]]);
        }
        else {
            // non-clipped projections are panned
            // by rotation along lon
            map.projection.rotate([-o1[0], -o0[1]]);
            // and by translation along lat
            // if scale is greater than fullScale
            // TODO more conditions?
            if (map.projection.scale() > projLayout._fullScale) {
//                 map.projection.translate([t0[0], t1[1]]);
                // TODO does 'center' work as well as 'translate' ?
                map.projection.center([c0[0], c1[1]]);
            }
        }
    }

    var zoom = d3.behavior.zoom()
        .scale(map.projection.scale())
        .scaleExtent([
            // TODO something smarter!!!
            projLayout._fullScale,
            10 * projLayout._fullScale
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
            // TODO scope extent!
            return d3.geo.graticule()
                .extent([
                    [-180, 90], [180, -90]
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
        isClipped = fullLayout.map.projection._isClipped,
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
                    angle = d3.geo.distance([d.lon, d.lat],
                                            [-p[0], -p[1]]);
                return (angle > Math.PI / 2) ? "0" : "1.0";
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

    });

};
