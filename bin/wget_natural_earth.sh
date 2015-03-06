#! /bin/bash

. ./bin/vars.sh

# -------------------------------------------------------------------------------


if [ ! -d "$WGET_DIR" ]; then
    mkdir $WGET_DIR
fi

cd $WGET_DIR

rm -f $FILENAME_LIST

for v in ${PHYSICAL_VECTORS[@]}; do

    f="${FILEPREFIX}${RESOLUTION}_${v}"

    echo $f >> $FILENAME_LIST

    if [ ! -f "$f.zip" ]; then
        wget "${URLBASE}${RESOLUTION}/physical/$f.zip"
    fi

done

for v in ${CULTURAL_VECTORS[@]}; do

    f="${FILEPREFIX}${RESOLUTION}_${v}"
    
    echo $f >> $FILENAME_LIST

    if [ ! -f "$f.zip" ]; then
        wget "${URLBASE}${RESOLUTION}/cultural/$f.zip"
    fi
done
