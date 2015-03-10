all: wget convert

wget:
	node ./bin/wget_natural_earth.js

shp_to_geojson:
	node ./bin/shp_to_geojson.js

geojson_to_topojson:
	node ./bin/geojson_to_topojson.js

convert: shp_to_geojson geojson_to_topojson
