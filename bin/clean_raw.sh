#! /bin/bash

. ./bin/vars.sh

exts_to_clean=(
    "shp"
    "shx"
    "sbn"
    "sbx"
    "dbf"
    "README.html"
    "prj"
    "VERSION.txt"
)

# ===============================================================================

cd $WGET_DIR

for v in ${VECTORS[@]}; do

    for e in ${exts_to_clean[@]}; do
        echo *${v}*.${e}
        rm -f *${v}*.${e}
    done

done
