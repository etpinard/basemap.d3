var map = {};

map.makeProjection = function makeProjection(gd) {
    var fullLayout = gd._fullLayout,
        proj = fullLayout.map.projection,
        out;
    
    out = d3.geo[proj.type]()
        .scale(proj._scale)
        .translate(proj._translate)
        .precision(0.1)
//         .clipExtent([[0, 0], [width/2 , height/2]])
        .center(proj.center)
        .rotate(proj.rotate);

    if (proj.parallels) out.parallels(proj.parallels);

    if (fullLayout._isOrthographic) out.clipAngle(90);

    return out;
};

map.supplyDefaults = function supplyDefaults(gd) {
    var data = gd.data,
        fullData = [];

    fullData = data;  // (shortcut) should coerce instead

    gd._fullData = fullData;
};

map.supplyLayoutDefaults = function supplyLayoutDefaults(gd) {
    var layout = gd.layout,
        projection = layout.map.projection;
        fullLayout = {};

    fullLayout = layout;  // (shortcut) should coerce instead

    fullLayout._isOrthographic = (projection.type === 'orthographic');

    function getScale() {
        if (projection.type === 'orthographic') return 250;
        else return (layout.width + 1) / 2 / Math.PI;
    }

    fullLayout.map.projection._translate = [layout.width / 2,
                                            layout.height / 2];

// 
//     function getExtent() {
//     }

    fullLayout.map.projection._scale = getScale();

    if (!('parallels' in projection)) fullLayout.map.projection.parallels = false;

    gd._fullLayout = fullLayout;
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
    var fullLayout = gd._fullLayout,
        proj = fullLayout.map.projection,
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
                map.drawPaths();
            }
        });

    var zoom = d3.behavior.zoom()
        .scale(fullLayout.map.projection._scale)
        .scaleExtent([100, 1000])
        .on("zoom", function() {
            console.log('zooming');
            map.projection.scale(d3.event.scale);
            map.drawPaths();
        });

    var dblclick = function() {
        console.log('double clicking');
        map.projection = map.makeProjection(gd);
        map.drawPaths();
    };
        
    svg
        .call(drag)
        .call(zoom)
        .on("click.zoom", null)
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
        if (fullLayout.map.basemap['show' + layer]===true) {
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
        .attr("d", map.worldPath());

    gData = map.svg.select("g.data")
        .selectAll("g.trace")
        .data(cd)
      .enter().append("g")
        .attr("class", "trace")
      .append("g")
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
                    s.attr("d", map.pointPath);
                });
    });

    map.drawPaths(gd);
};

map.drawPaths = function drawPaths(gd) {
    var isOrthographic = fullLayout._isOrthographic;

    if (isOrthographic) {
        d3.select("path.sphere")
            .attr("d", map.worldPath());
        // hide paths over the edge
        d3.selectAll("path.point")
            .attr("opacity", function(d) {
                var p = map.projection.rotate(),
                    geoangle = d3.geo.distance([d.lon, d.lat],
                                               [-p[0], -p[1]]);
                return (geoangle > Math.PI / 2) ? "0" : "1.0";
            });
    }

    d3.selectAll("g.baselayer path")
        .attr("d", map.worldPath());
    d3.select("path.graticule")
        .attr("d", map.worldPath());
    d3.selectAll("path.point")
        .attr("transform", map.pointTransform);
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
    var basemap = gd._fullLayout.map.basemap;

    d3.selectAll("g.baselayer path")
        .each(function(d) {
            var layer = this.classList[0];
            d3.select(this)
                .attr("stroke", basemap[layer + 'color'])
                .attr("fill",  basemap[layer + 'fill'])
                .attr("stroke-width", basemap[layer + 'width']);
        });

    d3.selectAll("g.points")
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace;
            console.log(trace.marker.color)
            s.selectAll("path.point")
                .attr("fill", trace.marker.color);
        });
};
