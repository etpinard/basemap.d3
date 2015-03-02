# basemap.d3

A simple API for generating maps using d3.js.

See example at [etpinard.github.io/basemap.d3/](http://etpinard.github.io/basemap.d3/).


### Current features

- Scatter points in (lon, lat) coordintates on top of a basemap
- Periodic panning
- Zoom and pan
- Basemap of coastlines, land, ocean, countries, USA states

### TODO list

- Support line between points
- Support choropleths
- ...

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

Describe the figure object in `./src/gd.js`



