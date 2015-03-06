all: wget convert clean

wget:
	@./bin/wget_natural_earth.sh

convert:
	@./bin/convert_to_topojson.sh

clean:
	@./bin/clean_raw.sh
