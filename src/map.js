var map = {};

map.CLIPANGLES = {
    'orthographic': 90,
    'azimuthalEqualArea': 180 - 1e-3,
    'azimuthalEquidistant': 180 - 1e-3,
    'gnomonic': 90 - 1e-3,
    'stereographic': 180 - 1e-4
};

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

    coerce('width', 700);
    coerce('height', 450);

    coerceMap('domain', {x: [0, 1], y: [0, 1]});

    var scope = coerceMap('scope', 'world');
    var resolution = coerceMap('resolution', '110m');
    coerceMap('_topojson', scope + '_' + resolution);

    coerce('_panmode', (scope==='world' ? 'periodic': 'fixed'));

    var type = coerceMapNest('projection', 'type', 'equirectangular');

    // Is this more intuitive?
    var rotate = coerceMapNest('projection', 'rotate', [0, 0]);
    coerceMapNest('projection', '_rotate', [-rotate[0], -rotate[1]]);

    coerceMapNest('projection', '_isClipped', (type in map.CLIPANGLES));

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

    var lonrange = coerceMapNest('lonaxis', 'range', [-180, 180]);
    coerceMapNest('lonaxis', 'showgrid', true);
    coerceMapNest('lonaxis', 'tick0', lonrange[0]);
    coerceMapNest('lonaxis', 'dtick', 30);
    coerceMapNest('lonaxis', 'gridcolor', '#777');
    coerceMapNest('lonaxis', 'gridwidth', 1);

    // TODO add zeroline attributes

    var latrange = coerceMapNest('lataxis', 'range', [-90, 90]);
    coerceMapNest('lataxis', 'showgrid', true);
    coerceMapNest('lataxis', 'tick0', latrange[0]);
    coerceMapNest('lataxis', 'dtick', 10);
    coerceMapNest('lataxis', 'gridcolor', '#777');
    coerceMapNest('lataxis', 'gridwidth', 1);

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

map.setPosition = function(gd) {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        mapDomain = mapLayout.domain,
        projLayout = mapLayout.projection,
        isClipped = projLayout._isClipped,
        lonRange = mapLayout.lonaxis.range,
        latRange = mapLayout.lataxis.range;

    var gs = {};  // copied from graph_obj.js
    gs.l = 0;    // Math.round(ml);
    gs.r = 0;    // Math.round(mr);
    gs.t = 0;    // Math.round(mt);
    gs.b = 0;    // Math.round(mb);
//     gs.p = Math.round(fullLayout.margin.pad);
    gs.w = Math.round(fullLayout.width) - gs.l - gs.r;
    gs.h = Math.round(fullLayout.height) - gs.t - gs.b;


    map.setScale = function() {
        return '';
    }

    map.setClipExtent = function(projection) {
        var projRotateLon = projLayout.rotate[0],
            leftLim =  projRotateLon - 180,
            rightLim = projRotateLon + 180,
            lon0 = (lonRange[0] < leftLim) ? leftLim : lonRange[0],
            lon1 = (lonRange[1] > rightLim) ? rightLim : lonRange[1];
    
//         // limit lon range to [leftLim, rightLim] with lon0 < lon1
//         // TODO same for lat !!

        projLayout._clipExtent = [
            projection([lon0, latRange[1]]),
            projection([lon1, latRange[0]])
        ];
    }

// from axes.js:setScale
//     if(ax._id.charAt(0)==='y') {
//         ax._offset = gs.t+(1-ax.domain[1])*gs.h;
//         ax._length = gs.h*(ax.domain[1]-ax.domain[0]);
//         ax._m = ax._length/(ax.range[0]-ax.range[1]);
//         ax._b = -ax._m*ax.range[1];
//     }
//     else {
//         ax._offset = gs.l+ax.domain[0]*gs.w;
//         ax._length = gs.w*(ax.domain[1]-ax.domain[0]);
//         ax._m = ax._length/(ax.range[1]-ax.range[0]);
//         ax._b = -ax._m*ax.range[0];
//     }

    mapLayout._length = gs.w * (mapDomain.x[1] - mapDomain.x[0]);
//     mapLayout._m = mapLayout._length * 360 / (lonaxisRange[1] - lonaxisRange[0]);
    mapLayout._m = mapLayout._length;

    // ...
    projLayout._translate = [
        gs.l + gs.w / 2,
        gs.t + gs.h / 2,
    ];

    // projection scale at full range
    projLayout._fullScale = (isOrthographic)
        ? 150
        : (Math.min(gs.w, gs.h) + 1) / 2 / Math.PI;

    //

    if (isOrthographic) {
        projLayout._scale = 150 ;
    }
    else {
        projLayout._scale = (mapLayout._m - 4) / 2 / Math.PI;
//         projLayout._scale = projLayout._fullScale;
    }

};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        mapLayout = fullLayout.map,
        projLayout = mapLayout.projection,
        projType = projLayout.type,
        lonaxisLayout = mapLayout.lonaxis,
        lataxisLayout = mapLayout.lataxis,
        projection;

    map.setScale();

    projection = d3.geo[projType]()
        .scale(projLayout._scale)
        .translate(projLayout._translate)
        .precision(0.1)
        .rotate(projLayout._rotate);

    if (projLayout.parallels) projection.parallels(projLayout.parallels);

    if (projType in map.CLIPANGLES) projection.clipAngle(map.CLIPANGLES[projType]);
    else {
//         map.setClipExtent(projection);
//         projection.clipExtent(projLayout._clipExtent);
    }

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
        } else {
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
        projLayout = fullLayout.map.projection,
        isClipped = projLayout._isClipped;

    var svg = d3.select("body").append("svg")
        .attr("width", fullLayout.width)
        .attr("height", fullLayout.height);

    svg.append("g")
        .classed("basemap", true);

    svg.append("g")
        .classed("graticule", true);

    function doExtraOrthographic() {
        svg.append("g")
            .classed("sphere", true);
        svg.select("g.sphere")
            .append("path")
            .datum({type: "Sphere"})
            .attr("class", "sphere");
    }
//     if (isClipped) doExtraOrthographic();

    svg.append("g")
        .classed("data", true);

    // rectangle around svg container
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", fullLayout.width)
        .attr("height", fullLayout.height)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 4);

    doExtraOrthographic();

    var m0,  // variables for dragging
        o0,
        t0;

    var drag = d3.behavior.drag()
        .on("dragstart", function() {
            var p = map.projection.rotate(),
                t = map.projection.translate();
            console.log('drag start');
            console.log(map.projection.scale());
            m0 = [d3.event.sourceEvent.pageX,
                  d3.event.sourceEvent.pageY];
            o0 = [-p[0], -p[1]];
            t0 = [t[0], t[1]];
        })
        .on("drag", function() {
            if (m0) {
                var m1 = [d3.event.sourceEvent.pageX,
                          d3.event.sourceEvent.pageY],
                    o1 = [o0[0] + (m0[0] - m1[0]) / 4,
                          o0[1] + (m1[1] - m0[1]) / 4],
                    t1 = [t0[0] + (m0[0] - m1[0]),
                          t0[1] + (m1[1] - m0[1])];
                console.log('dragging');
                console.log(map.projection.scale());
                if (isClipped) {
                    // clipped  projections are panned by rotation
                    map.projection.rotate([-o1[0], -o1[1]]);
                } else {
                    // non-clipped projections are panned
                    // by rotation along lon
                    map.projection.rotate([-o1[0], -o0[1]]);
                    // and by translation along lat
                    // if scale is greater than fullScale
                    // TODO more conditions?
                    if (map.projection.scale() > projLayout._fullScale) {
                        map.projection.translate([t0[0], t1[1]]);
                    }
                }
                map.drawPaths(gd);
            }
        });

    var zoom = d3.behavior.zoom()
        .scale(projLayout._scale)
        .scaleExtent([projLayout._fullScale, 1000])
        .on("zoom", function() {
            console.log('zooming');
            console.log(map.projection.scale());
            map.projection.scale(d3.event.scale);
            map.drawPaths(gd);
        });

    var dblclick = function() {
        // TODO fix bug zoom
        // -> dblclick -> translate start at last zoomed in position
        console.log('double clicking');
        console.log(map.projection.scale());
        map.makeProjection(gd);
        console.log(map.projection.scale());
        map.drawPaths(gd);
    };

    svg
        .call(drag)
        .call(zoom)
        .on("dblclick.zoom", null)
        .on("dblclick", dblclick);

   return svg;
};

map.init = function init(gd) {
    var topo = map.topo,
        cd = gd.calcdata,
        fullLayout = gd._fullLayout,
        gBasemap,
        gGraticule,
        gData,
        gChoropleth,
        gBasemapOverChoropleth,
        hasChoropleth = false,
        i;

    map.fillLayers = ['ocean', 'land', 'lakes'];
    map.lineLayers = ['subunits', 'countries', 'coastlines', 'rivers'];

    map.baselayers = map.fillLayers.concat(map.lineLayers);
    map.baselayersOverChoropleth = ['rivers', 'lakes'];

    map.svg = map.makeSVG(gd);

    function plotBaseLayer(s, layer) {
        if (fullLayout.map['show' + layer]===true) {
             s.append("g")
                .datum(topojson.feature(topo,
                                        topo.objects[layer]))
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

    function plotGraticule(s, ax) {
        var otherAx = {
                lonaxis: 'lataxis',
                lataxis: 'lonaxis'
            }[ax],
            axLayout = fullLayout.map[ax],
            otherAxLayout = fullLayout.map[otherAx],
            lonExtent = {
                lonaxis: [axLayout.tick0, axLayout.range[1]],
                lataxis: otherAxLayout.range
            }[ax],
            latExtent = {
                lonaxis: otherAxLayout.range,
                lataxis: [axLayout.tick0, axLayout.range[1]]
            }[ax],
            step = {
                lonaxis: [axLayout.dtick],
                lataxis: [0, axLayout.dtick]
            }[ax],
            graticule =  d3.geo.graticule()
                .extent([
                    [lonExtent[0], latExtent[0]],
                    [lonExtent[1], latExtent[1]]
                ])
                .step(step);
        s.append("path")
         .attr("class", ax + 'graticule')
         .datum(graticule);
    }

    // graticule layers - should these be over choropleth?
    gGraticule = map.svg.select("g.graticule");
    if (fullLayout.map.lonaxis.showgrid) plotGraticule(gGraticule, 'lonaxis');
    if (fullLayout.map.lataxis.showgrid) plotGraticule(gGraticule, 'lataxis');

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

    map.drawPaths(gd);  // draw the paths
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

map.drawPaths = function drawPaths() {
    var projection = map.projection,
        path = d3.geo.path().projection(projection);

    var fullLayout = gd._fullLayout,
        isClipped = fullLayout.map.projection._isClipped;

    function translatePoints(d) {
        var lonlat = projection([d.lon, d.lat]);
        return "translate(" + lonlat[0] + "," + lonlat[1] + ")";
    }

    d3.select("path.sphere")
        .attr("d", path);

    if (isClipped) {
        d3.select("path.sphere")
            .attr("d", path);
        // hide paths over the edge
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

    var gData = map.svg.select("g.data");
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
        if (layer!=='coastlines') layer += 'line';  // coastline is an exception

        s.attr("fill", "none")
         .attr("stroke", mapLayout[layer + 'color'])
         .attr("stroke-width", mapLayout[layer + 'width']);
    });

    ['lonaxis', 'lataxis'].forEach(function(ax){
        var s = d3.select("path." + ax + "graticule");

        s.attr("fill", "none")
         .attr("stroke", mapLayout[ax].gridcolor)
         .attr("stroke-width", mapLayout[ax].gridwidth)
         .attr("stroke-opacity", 0.5);
    });

    var colorscale = d3.scale.log()
        .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
        .interpolate(d3.interpolateHcl);

    d3.selectAll("g.choropleth")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            // TODO generalize
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

    map.setPosition(gd);
    map.makeProjection(gd);

    var topojsonPath = "../raw/" + gd._fullLayout.map._topojson + ".json";

    d3.json(topojsonPath, function(error, topo) {

        map.topo = topo;
        map.makeCalcdata(gd);

        map.init(gd);
        map.style(gd);

    });

};
