var map = {};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        mapObj = fullLayout.map,
        projObj = mapObj.projection,
        lonaxisObj = mapObj.lonaxis,
        lataxisObj = mapObj.lataxis,
        projection;
    
    projection = d3.geo[projObj.type]()
        .scale(projObj._scale)
        .translate(projObj._translate)
        .precision(0.1)
        .center(projObj.center)
        .rotate(projObj._rotate);

    if (projObj.parallels) projection.parallels(projObj.parallels);

    if (fullLayout._isOrthographic) projection.clipAngle(90);

    function getClipExtent() {
        var lonRange = lonaxisObj.range,
            latRange = lataxisObj.range,
            projRotateLon = projObj.rotate[0],
            leftLim =  projRotateLon - 180,
            rightLim = projRotateLon + 180,
            lon0 = (lonRange[0] < leftLim) ? leftLim : lonRange[0],
            lon1 = (lonRange[1] > rightLim) ? rightLim : lonRange[1];

            projObj._lonExtent = [lon1 - lon0];

        // TODO Move this in supplyLayoutDefaults

        // limit lon range to [leftLim, rightLim] with lon0 < lon1

        // TODO for lat !!

        return [projection([lon0, latRange[1]]),
                projection([lon1, latRange[0]])];
    }

    if (lonaxisObj.range!=='auto' &&
            lataxisObj!=='auto') projection.clipExtent(getClipExtent());

    return projection;
};

map.supplyDefaults = function supplyDefaults(gd) {
    var data = gd.data,
        fullData = [];

    fullData = data;  // (shortcut) should coerce instead

    gd._fullData = fullData;
};

map.supplyLayoutDefaults = function supplyLayoutDefaults(gd) {
    var layout = gd.layout,
        projObjIn = layout.map.projection;
        fullLayout = {};

    fullLayout = layout;  // (shortcut) should coerce instead

    fullLayout._isOrthographic = (projObjIn.type === 'orthographic');

    fullLayout.map.projection._translate = [layout.width / 2,
                                            layout.height / 2];

    // Is this more intuitive ?
    fullLayout.map.projection._rotate = [-projObjIn.rotate[0],
                                         -projObjIn.rotate[1]];

    function getScale() {
        // TODO something smarter ?
        if (projObjIn.type === 'orthographic') return 250;
        else return (layout.width + 1) / 2 / Math.PI;
    }
    fullLayout.map.projection._scale = getScale();

    if (!('parallels' in projObjIn)) fullLayout.map.projection.parallels = false;

    gd._fullLayout = fullLayout;
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


map.makeCalcdata = function makeCalcdata(gd) {
    var fullData = gd._fullData,
        cd = new Array(fullData.length),
        N,
        cdi,
        i,
        j;

    for (i = 0; i < fullData.length; i++) {
        trace = fullData[i];

        // don't project calcdata,
        // as projected calcdata need to be computed
        // on drag event.

        if (map.isScatter(trace)) {
            N = Math.min(trace.lon.length, trace.lat.length);
            cdi = new Array(N);

            for (j = 0; j < N; j++) {
                cdi[j] = {
                    lon: trace.lon[j],
                    lat: trace.lat[j]
                };
            }

        } else if (map.isChoropleth(trace)) {
            var features = topojson.feature(map.world,
                                            map.world.objects.countries)
                                            .features;
            N = trace.loc.length;
            cdi = new Array(N);

            // TODO jsperf
            var ids = features.map(function(a) { return a.properties.id; }),
                indexOfId;

            for (j = 0; j < N; j++) {
                indexOfId = ids.indexOf(trace.loc[j]);
                if (indexOfId===-1) continue;
                cdi[j] = features[indexOfId];
                cdi[j].z = trace.z[j];
            }

        }

        cdi[0].trace = trace;
        cd[i] = cdi;
    }

    gd.calcdata = cd;
    return gd;
};

map.makeSVG = function makeSVG(gd) {
    var fullLayout = gd._fullLayout,
        projObj = fullLayout.map.projection,
        isOrthographic = fullLayout._isOrthographic;

    var svg = d3.select("body").append("svg")
        .attr("width", gd.layout.width)
        .attr("height", gd.layout.height);

    svg.append("g")
        .classed("basemap", true);

    // TODO should be a per-axis attribute
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
    if (isOrthographic) doExtraOrthographic();

    svg.append("g")
        .classed("data", true);

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
                if (isOrthographic) {
                    // orthographic projections are panned by rotation
                    map.projection.rotate([-o1[0], -o1[1]]);
                } else {
                    // orthographic projections are panned
                    // by rotation along lon
                    // and by translation along lat
                    map.projection.rotate([-o1[0], -o0[1]]);
                    map.projection.translate([t0[0], t1[1]]);
                }
                map.drawPaths(gd);
            }
        });

    var zoom = d3.behavior.zoom()
        .scale(projObj._scale)
        .scaleExtent([100, 1000])
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
        map.projection = map.makeProjection(gd);
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
    var world = map.world,
        cd = gd.calcdata,
        fullLayout = gd._fullLayout,
        gData;

    // TODO add support for subunits
    map.baseLayers = ['ocean', 'land',
                      'countries', 'coastlines'];

    map.svg = map.makeSVG(gd);

    function plotBaseLayer(layer) {
        if (fullLayout.map['show' + layer]===true) {
            map.svg.select("g.basemap")
              .append("g")
                .datum(topojson.feature(world,
                                        world.objects[layer]))
                .attr("class", "baselayer")
              .append("path")
                .attr("class", layer);
        }
    }
    map.baseLayers.forEach(plotBaseLayer);

    map.svg.select("g.graticule")
        .append("path")
        .datum(d3.geo.graticule())
        .attr("class", "graticule")
        .attr("d", map.getPath());

    gData = map.svg.select("g.data")
        .selectAll("g.trace")
        .data(cd)
      .enter().append("g")
        .attr("class", "trace");

    // choropleth
    gData.append("g")
        .attr("class", "choropleth")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            if (!map.isChoropleth(trace)) s.remove();
            else {
                s.selectAll("path.regions")
                    .data(Object)
                .enter().append("path")
                  .attr("class", "region");
            }
        });

    // lines
    gData.append("path")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            if (!map.hasScatterLines(trace)) s.remove();
            else {
                s.datum(map.makeLine(d))
                 .attr("class", "js-line");
            }
        });

    // markers
    gData.append("g")
        .attr("class", "points")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            if (!map.hasScatterMarkers(trace)) s.remove();
            else {
                s.selectAll("path.point")
                    .data(Object)
                  .enter().append("path")
                    .attr("class", "point")
                    .each(function(d) {
                        var s = d3.select(this);
                            s.datum(map.makePoint(d))
                    });
            }
        });

    map.drawPaths(gd);
};

map.drawPaths = function drawPaths(gd) {
    var isOrthographic = fullLayout._isOrthographic;

    if (isOrthographic) {
        d3.select("path.sphere")
            .attr("d", map.getPath());
        // hide paths over the edge
        d3.selectAll("path.point")
            .attr("opacity", function(d) {
                var p = map.projection.rotate(),
                    angle = d3.geo.distance([d.lon, d.lat],
                                            [-p[0], -p[1]]);
                return (angle > Math.PI / 2) ? "0" : "1.0";
            });
    }

    d3.selectAll("g.baselayer path")
        .attr("d", map.getPath());
    d3.select("path.graticule")
        .attr("d", map.getPath());
    d3.selectAll("path.region")
        .attr("d", map.getPath());
    d3.selectAll("path.js-line")
        .attr("d", map.getPath());
    d3.selectAll("path.point")
        .attr("d", map.getPath());

};

map.getPath = function getPath() {
    return d3.geo.path().projection(map.projection);
};

map.makePoint = function makePoint(d) {
    var point = {
        type: "Point",
        coordinates: [d.lon, d.lat],
    }
    if (trace in d) point.trace = trace;
    return point;
};

map.makeLine = function makeLine(d) {
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

map.pointPath = function pointPath(d) {
    rs = 10;
    return 'M'+rs+',0A'+rs+','+rs+' 0 1,1 0,-'+rs+
           'A'+rs+','+rs+' 0 0,1 '+rs+',0Z';
};

map.plot = function plot(gd) {

    d3.json("raw/world-110m.json", function(error, world) {

        map.world = world;

        map.supplyDefaults(gd);
        map.supplyLayoutDefaults(gd);
        map.projection = map.makeProjection(gd);
        map.makeCalcdata(gd);

        map.init(gd);
        map.drawPaths(gd);
        map.style(gd);

    });

};

map.style = function(gd) {
    var mapObj = gd._fullLayout.map;

    d3.selectAll("g.baselayer path")
        .each(function(d) {
            var layer = this.classList[0];
            d3.select(this)
                .attr("stroke", mapObj[layer + 'color'])
                .attr("fill",  mapObj[layer + 'fill'])
                .attr("stroke-width", mapObj[layer + 'width']);
        });

    var color = d3.scale.log()
        .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
        .interpolate(d3.interpolateHcl);

    d3.selectAll("g.choropleth")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            color.domain([d3.quantile(trace.z, 0.01),  // TODO generalize
                          d3.quantile(trace.z, 0.99)]);
            s.selectAll("path.region")
                .each(function(d) {
                    var s  = d3.select(this);
                    s.attr("fill", function(d) { return color(d.z); });
                });
        });

    d3.selectAll("g.trace path.js-line")
        .each(function(d) {
            var s = d3.select(this),
                line = d.trace.line;
            s.attr("stroke", line.color)
             .attr("stroke-width", line.width);
        });

    d3.selectAll("g.points")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;
            s.selectAll("path.point")
                .attr("fill", trace.marker.color);
        });
};
