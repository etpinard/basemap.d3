#! /bin/bash

pidfile="./.server.pid"

case "$1" in

    up)
        http-server -p 8008 &
        echo $! > ${pidfile}
        ;;
    halt)
        kill -9 $(cat ${pidfile})
        ;;
    status)
        ps aux | grep http-server
        ;;
    *)
        echo $"Usage: $0 {up|halt|status}"
        exit 1
 
esac
