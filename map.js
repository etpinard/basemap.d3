var Plotly = {
    Map: {}
};

var map = Plotly.Map;

map.svg = (function makeSVG(l) {
    var svg = d3.select("body").append("svg")
        .attr("width", l.width)
        .attr("height", l.height);

    svg.append("g")
        .classed("graticule", true);

    svg.append("g")
        .classed("physical", true);

    svg.append("g")
        .classed("cultural", true);

    svg.append("g")
        .classed("data", true);

   return svg;
}(gd.layout));

map.projection = (function makeProjection(layout) {
    var proj = layout.map.projection,
        width = layout.width,
        height = layout.height,
        projType = proj.type,
        projScope = proj.scope,
        projScale = (width + 1) / 2 / Math.PI;

    return d3.geo[projType]()
        .scale(projScale)
        .translate([width / 2, height / 2])
        .precision(0.1)
        .center(proj.center)
        .rotate(proj.rotate);
}(gd.layout));

map.makeCalcdata = function makeCalcdata(gd) {
    var data = gd.data,
        cd = new Array(data.length),
        N,
        cdi;

    for (var i = 0; i < data.length ; i++) {
        trace = data[i];
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

map.plot = function(gd) {
    var cd = gd.calcdata,
        gData;

    map.svg.select("g.physical")
        .datum(topojson.feature(map.world, map.world.objects.land))
        .append("path")
        .attr("class", "physical")
        .attr("d", worldPath());

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

                    s.attr("transform", pointTransform);
                    s.attr("d", pointPath);
                });
    });

};

function worldPath() {
    return d3.geo.path().projection(map.projection);
}

function pointTransform(d) {
    var lonlat = map.projection([d.lon, d.lat]);
    return "translate(" + lonlat[0] + "," + lonlat[1] + ")";
}

function pointPath(d) {
    rs = 10;
    return 'M'+rs+',0A'+rs+','+rs+' 0 1,1 0,-'+rs+
           'A'+rs+','+rs+' 0 0,1 '+rs+',0Z';
}

map.style = function(world, gd) {
    // ...
};

(function() {
    var m0,
        o0;

    var drag = d3.behavior.drag()
        .on("dragstart", function() {
            var p = map.projection.rotate();
            m0 = [d3.event.sourceEvent.pageX,
                d3.event.sourceEvent.pageY];
            o0 = [-p[0], 0];
            console.log('drag start')
        })
        .on("drag", function() {
            if (m0) {
            var m1 = [d3.event.sourceEvent.pageX,
                      d3.event.sourceEvent.pageY],
                o1 = [o0[0] + (m0[0] - m1[0]) / 4, 0];
            map.projection.rotate([-o1[0], 0]);
            }
            console.log('dragging')

            // recompute world path and translate points
            d3.select("path.physical").attr("d", worldPath());
            d3.selectAll("path.point").attr("transform", pointTransform);

        });
        
    map.svg.call(drag);
}());
