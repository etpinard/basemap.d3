#! /bin/bash

. ./bin/vars.sh

# -------------------------------------------------------------------------------


cd $WGET_DIR

for f in $(cat $FILENAME_LIST); do
    if [ ! -f $f.shp ]; then
        unzip $f.zip
    fi
done

# TODO generalize
# Get shapefile properties and format them into topojson
rm -f countries.json
ogr2ogr \
    -f GeoJSON \
    countries.json \
    ${FILEPREFIX}${RESOLUTION}_${CULTURAL_VECTORS[0]}.shp

out="../world-110m.json"

# Combine layer into one topojson
# N.B. requires also .shx
rm -f $out
topojson \
    -o $out \
    coastlines=${FILEPREFIX}${RESOLUTION}_${PHYSICAL_VECTORS[0]}.shp \
    land=${FILEPREFIX}${RESOLUTION}_${PHYSICAL_VECTORS[1]}.shp \
    ocean=${FILEPREFIX}${RESOLUTION}_${PHYSICAL_VECTORS[2]}.shp \
    --properties id=adm0_a3 \
    --properties name=name \
    -- \
    countries.json
