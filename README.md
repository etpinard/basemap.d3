# basemap.d3

A simple API for generating maps using d3.js.

See examples at [etpinard.github.io/basemap.d3/](http://etpinard.github.io/basemap.d3/).


### Current features

- Basemap of coastlines, land, ocean, countries, USA states, river and lakes
- Scatter points/text and great circle paths in (lon, lat) coordintates on top of a basemap
- Choropleth of countries (with custom boundary lines)
- Scatter points/text by locations (e.g. ISO-3)
- Periodic panning and zoom
- Customizable lon/lat axis ranges, grid width, color and spacing

### TODO list

- Improve maps set scale (as a function of the figure size and axis range)

- Improve scopes: figure out what land / ocean / coastlines layers should be

- Fix zoom bug (zoom -> dbl click -> pan starts panning at last zoomed position)
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

- Open up http://localhost:8008/ 

### API

Describe the figure object of the examples in `./examples/`

