#! /bin/bash

resolution="110m"  # or "10m" or "50m"

# Go to http://www.naturalearthdata.com/downloads/ for full list

physical_vectors=(
    "coastline"
    "land"
    "ocean"
)
cultural_vectors=(
    "admin_0_countries"
    "admin_1_states_provinces"
)
vectors=( "${physical_vectors[@]}" "${cultural_vectors[@]}"  )

urlbase="http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/"
fileprefix="ne_"

exts=(
    "shp"
    "shx"
    "sbn"
    "sbx"
    "dbf"
    "README.html"
    "prj"
    "VERSION.txt"
)

wget_dir="./natural_earth"
if [ ! -d "$wget_dir" ]; then
    mkdir $wget_dir
fi

out="world-${resolution}.json"

# -------------------------------------------------------------------------------

case "$1" in

    wget)

        cd $wget_dir
        for v in ${physical_vectors[@]}; do
            f="${fileprefix}${resolution}_${v}.zip"
            if [ ! -f "$f" ]; then
                wget "${urlbase}${resolution}/physical/$f"
            fi
        done
        for v in ${cultural_vectors[@]}; do
            f="${fileprefix}${resolution}_${v}.zip"
            if [ ! -f "$f" ]; then
                wget "${urlbase}${resolution}/cultural/$f"
            fi
        done
        ;;

    convert)
        cd $wget_dir

        for v in ${vectors[@]}; do
            if [ ! -f *$v*.shp ]; then
                unzip "*$v*.zip"
            fi
        done

        # Get shapefile properties and format them into topojson
        rm -f countries.json
        ogr2ogr \
            -f GeoJSON \
            countries.json \
            ${fileprefix}${resolution}_${cultural_vectors[0]}.shp

        # Combine layer into one topojson
        # N.B. requires also .shx
        rm -f ../$out
        topojson \
            -o ../$out \
            coastlines=${fileprefix}${resolution}_${physical_vectors[0]}.shp \
            land=${fileprefix}${resolution}_${physical_vectors[1]}.shp \
            ocean=${fileprefix}${resolution}_${physical_vectors[2]}.shp \
            --properties id=adm0_a3 \
            --properties name=name \
            -- \
            countries.json
       ;;

    clean)
        cd $wget_dir

        for v in ${vectors[@]}; do
            for e in ${exts[@]}; do
                rm -f *${v}*.${e}
            done
        done
    ;;

esac
