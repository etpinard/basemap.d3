var map = {};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        width = fullLayout.width,
        height = fullLayout.height,
        proj = fullLayout.map.projection,
        projType = proj.type,
        projScope = proj.scope,
        projScale = (width + 1) / 2 / Math.PI,
        out;
    
    out = d3.geo[projType]()
        .scale(projScale)
        .translate([width / 2, height / 2])
        .precision(0.1)
        .center(proj.center)
        .rotate(proj.rotate);

    if (fullLayout._isOrthographic) doExtraOrthographic();

    function doExtraOrthographic() {
        out
            .scale(250)
            .clipAngle(90);
    }

    return out;
};

map.supplyDefaults = function supplyDefaults(gd) {
    var data = gd.data,
        fullData = [];

    // ...
    fullData = data;

    gd._fullData = fullData;
};

map.supplyLayoutDefaults = function supplyLayoutDefaults(gd) {
    var layout = gd.layout,
        projection = layout.map.projection;
        fullLayout = {};

    // ...
    fullLayout = layout;

    fullLayout._isOrthographic = (projection.type === 'orthographic');

    gd._fullLayout = fullLayout;

    map.projection = map.makeProjection(gd);  // ...
};

map.makeCalcdata = function makeCalcdata(gd) {
    var fullData = gd._fullData,
        cd = new Array(fullData.length),
        N,
        cdi;

    for (var i = 0; i < fullData.length; i++) {
        trace = fullData[i];
        N = Math.min(trace.lon.length, trace.lat.length);
        cdi = new Array(N);

        for (var j = 0; j < N; j++) {
            // don't project calcdata,
            // as projected calcdata need to be computed
            // on drag event.
            cdi[j] = {
                lon: trace.lon[j],
                lat: trace.lat[j]
            };
        }

        cdi[0].trace = trace;
        cd[i] = cdi;
    }

    gd.calcdata = cd;
    return gd;
};

map.makeSVG = function makeSVG(gd) {
    var isOrthographic = gd._fullLayout._isOrthographic;

    var svg = d3.select("body").append("svg")
        .attr("width", gd.layout.width)
        .attr("height", gd.layout.height);

    if (isOrthographic) doExtraOrthographic();

    svg.append("g")
        .classed("basemap", true);

    svg.append("g")
        .classed("graticule", true);

    svg.append("g")
        .classed("data", true);


    function doExtraOrthographic() {
        svg.append("defs").append("path")
            .datum({type: "Sphere"})
            .attr("id", "sphere")
            .attr("d", map.worldPath());
        
        svg.append("use")
            .attr("class", "sphere-stroke")
            .attr("xlink:href", "#sphere");

        svg.append("use")
            .attr("class", "sphere-fill")
            .attr("xlink:href", "#sphere");
    }

    // attach events to svg
    var m0,
        o0;

    var drag = d3.behavior.drag()
        .on("dragstart", function() {
            var p = map.projection.rotate();
            m0 = [d3.event.sourceEvent.pageX,
                d3.event.sourceEvent.pageY];

            // non-orthographic projections get only longitudinal panning
            o0 = isOrthographic ? [-p[0], -p[1]] : [-p[0], 0];
            console.log('drag start');
        })
        .on("drag", function() {
            if (m0) {
            var m1 = [d3.event.sourceEvent.pageX,
                      d3.event.sourceEvent.pageY],
                o1 = [o0[0] + (m0[0] - m1[0]) / 4,
                      o0[1] + (m1[1] - m0[1]) / 4];
                newRotate = isOrthographic ? [-o1[0], -o1[1]] : [-o1[0], 0];
            map.projection.rotate(newRotate);
            console.log('dragging');
            }

            // recompute world path and translate points
            d3.selectAll("g.baselayer path")
                .attr("d", map.worldPath());
            d3.select("path.graticule")
                .attr("d", map.worldPath());
            d3.selectAll("path.point")
                .attr("transform", map.pointTransform);
        });
        
    svg.call(drag);

    return svg;
};

map.plot = function(gd) {
    var world = map.world,
        cd = gd.calcdata,
        gData;

    map.baseLayers = ['ocean', 'land',
                      'states_provinces', 'countries',
                      'coastlines'];

    map.svg = map.makeSVG(gd);  // ...

    function plotBaseLayer(layer) {
        map.svg.select("g.basemap")
            .append("g")
            .datum(topojson.feature(world,
                                    world.objects[layer]))
            .attr("class", "baselayer")
            .append("path")
            .attr("class", layer)
            .attr("d", map.worldPath());
    }
    map.baseLayers.forEach(plotBaseLayer);

    map.svg.select("g.graticule")
        .append("path")
        .datum(d3.geo.graticule())
        .attr("class", "graticule")
        .attr("d", map.worldPath());

    gData = map.svg.select("g.data")
        .selectAll("g.trace")
        .data(cd)
      .enter().append("g")
        .attr("class", "trace");

    gData.append("g")
        .attr("class", "points")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;

            s.selectAll("path.point")
                .data(Object)
              .enter().append("path")
                .attr("class", "point")
                .each(function(d) {
                    var s = d3.select(this);

                    s.attr("transform", map.pointTransform);
                    s.attr("d", map.pointPath);
                });
    });

};

map.worldPath = function worldPath() {
    return d3.geo.path().projection(map.projection);
};

map.pointTransform = function pointTransform(d) {
    var lonlat = map.projection([d.lon, d.lat]);
    return "translate(" + lonlat[0] + "," + lonlat[1] + ")";
};

map.pointPath = function pointPath(d) {
    rs = 10;
    return 'M'+rs+',0A'+rs+','+rs+' 0 1,1 0,-'+rs+
           'A'+rs+','+rs+' 0 0,1 '+rs+',0Z';
};

map.style = function(world, gd) {
    // ...
};
