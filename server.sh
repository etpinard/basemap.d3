#! /bin/bash

pidfile="./.server.pid"

case "$1" in

    up)
        http-server -p 8008 --silent &
        echo $! > ${pidfile}
        ;;
    halt)
        kill -9 $(cat ${pidfile})
        ;;
    status)
        ps aux | grep http-server | grep -v grep
        ;;
    *)
        echo $"Usage: $0 {up|halt|status}"
        exit 1
 
esac
