all: wget sleep convert

convert: shp_to_geojson sleep geojson_to_topojson

wget:
	node ./bin/wget_natural_earth.js

shp_to_geojson:
	rm -rf raw/natural_earth/*.geo.json
	node ./bin/shp_to_geojson.js

geojson_to_topojson:
	rm -rf raw/*.json
	node ./bin/geojson_to_topojson.js

sleep:
	@sleep 3

clean:
	rm -rf raw/natural_earth
