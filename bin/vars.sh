#! /bin/bash

OUT_DIR="./raw"
WGET_DIR="$OUT_DIR/natural_earth/"
FILENAME_LIST="list_of_filenames.txt"

# TODO Should be RESOLUTIONS
RESOLUTION="110m"  # or "10m" or "50m"

# Go to http://www.naturalearthdata.com/downloads/ for full list
PHYSICAL_VECTORS=(
    "coastline"
    "land"
    "ocean"
)
CULTURAL_VECTORS=(
    "admin_0_countries"
    "admin_1_states_provinces"
)
VECTORS=( "${PHYSICAL_VECTORS[@]}" "${CULTURAL_VECTORS[@]}"  )

URLBASE="http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/"
FILEPREFIX="ne_"
