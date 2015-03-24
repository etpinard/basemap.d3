# basemap.d3

A simple API for generating maps using d3.js.

See examples at [etpinard.github.io/basemap.d3/](http://etpinard.github.io/basemap.d3/).


### Current features

- Basemap of coastlines, land, ocean, countries, USA states, river and lakes
- Scatter points/text and great circle paths in (lon, lat) coordintates on top of a basemap
- Choropleth of countries (with custom boundary lines)
- Scatter points/text by locations (e.g. ISO-3)
- Periodic panning and zoom
- Customizable lon/lat axis ranges, graticule width, color and spacing
- Customizable map frame

### TODO list

- Improve maps set scale (almost there ...)
- Improve zoom
- Improve scopes: figure out what land / ocean / coastlines layers should be
- Add zeroline (lon/lat) attributes.
- Add more subunits and choropleth `locmode` values (but the Natural Earth 110m
  set only includes USA states, the 50m include USA states and Canadian
  provinces)

- ...

### Running it locally

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

- Convert shapefiles into topojson
```bash
make convert
```

- Install http-server
```bash
npm install http-server -g
```

- Boot up server
```bash
./server up

```

- Open up http://localhost:8000/

### API

Describe the figure object of the examples in `./examples/`

#### Axis ranges and projection rotation

... TODO

