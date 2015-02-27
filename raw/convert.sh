#! /bin/bash

vectors=(
    "ne_110m_admin_0_countries"
    "ne_110m_admin_1_states_provinces"
    "ne_110m_coastline"
    "ne_110m_land"
    "ne_110m_ocean"
)

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

out="../world-110m.json"


for i in ${vectors[@]}; do
    unzip $i 
done

topojson \
    -o $out \
    -- \
    countries=${vectors[0]}.shp \
    states_provinces=${vectors[1]}.shp \
    coastlines=${vectors[2]}.shp \
    land=${vectors[3]}.shp \
    ocean=${vectors[4]}.shp

# requires also .shx

for i in ${vectors[@]}; do
    for j in ${exts[@]}; do
        rm -f ${i}.${j}
    done
done
