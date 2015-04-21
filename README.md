# basemap.d3

A simple API for generating maps using d3.js.

See examples at [etpinard.github.io/basemap.d3/](http://etpinard.github.io/basemap.d3/).


### Current features

- Basemap of coastlines, land, ocean, countries, USA states, river and lakes
- Scatter points/text and great circle paths in (lon, lat) coordinates on top of a basemap
- Choropleth of countries (with custom boundary lines)
- Scatter points/text by locations (e.g. ISO-3)
- Periodic panning and zoom
- Customizable lon/lat axis ranges, graticule width, color and spacing
- Customizable map frame
- High resolution map scopes of Europe, Asia, Africa, North America, South America and USA 
- Integrated with all `d3.geo`
  [projections](https://github.com/mbostock/d3/wiki/Geo-Projections)

### TODO list

- Add more subunits and choropleth `locmode` values (but the Natural Earth 110m
  set only includes USA states, the 50m include USA states and Canadian
  provinces)
- Add zeroline (lon/lat) attributes.
- Add a conic-specific zoom handler

### Running it locally

- Install http-server
```bash
npm install http-server -g
```

- Boot up server
```bash
./server up

```

- Open up http://localhost:8000/

### Add or modify a map scope

This is done by filter and clipping Natural Earth shapefiles and converting them
to [topojson](https://github.com/mbostock/topojson):

- Install gdal (info:
  [ubuntu](http://www.sarasafavi.com/installing-gdalogr-on-ubuntu.html) ;
  [mac](https://trac.osgeo.org/gdal/wiki/BuildingOnMac))

- Install node.js dependencies
```bash
npm install
```

- Get [Natural Earth](http://www.naturalearthdata.com/downloads/) data
```bash
make wget
```

- Edit `./bin/config.json` (more info to come)

- Convert shapefiles into topojson
```bash
make convert
```

### API

Describe the figure object of the examples in `./examples/`
