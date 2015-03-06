# basemap.d3

A simple API for generating maps using d3.js.

See example at [etpinard.github.io/basemap.d3/](http://etpinard.github.io/basemap.d3/).


### Current features

- Scatter points and great circle paths in (lon, lat) coordintates on top of a basemap
- Choropleth of countries
- Periodic panning
- Zoom and pan, double clicking bring back to original position
- Basemap of coastlines, land, ocean, countries
- Customizable lon/lat axis ranges

### TODO list

- Support for administrative subunits!
- Fix zoom bug
- Add customizable scope (on the topojson itself before plotting!)
- Implement finer resolutions
- Handle choropleth with stroke color and width (set in data inherited, from layout)
- Handle grid (i.e. graticules) per axis
- ...

### Unanswered questions

- How to handle marker point? As SVG paths translated onto the map or as
  topojson coordinates projected into `<circle>` or `<rect>` elements.

## Running it locally

- Get [Natural Earth](http://www.naturalearthdata.com/downloads/) data
```bash
./raw/make.sh wget
```

- Convert shapefiles into topojson
```bash
./raw/make.sh convert
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

