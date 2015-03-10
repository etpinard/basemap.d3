# basemap.d3

A simple API for generating maps using d3.js.

See examples at [etpinard.github.io/basemap.d3/](http://etpinard.github.io/basemap.d3/).


### Current features

- Basemap of coastlines, land, ocean, countries
- Scatter points/text and great circle paths in (lon, lat) coordintates on top of a basemap
- Choropleth of countries
- Periodic panning and zoom
- Customizable lon/lat axis ranges

### TODO list

- Support for administrative subunits (Choropleth)/ rivers and lakes
- Support for 10m and 50m Natural Earth resolution / regions
- Handle grid (i.e. graticules) per axis
- Improve maps set scale (as a function of the figure size and axis range)

- Fix zoom bug (zoom -> dbl click -> pan starts panning at last zoomed position)
- ...

### Running it locally

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

