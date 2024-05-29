#!/bin/sh

CASSANDRA_CONFIG=/etc/cassandra/cassandra.yaml

replace_option() {
    option="$1"
    value="$2"

    sed -Eine "s/^$option:(.*)\$/$option: $value/" "$CASSANDRA_CONFIG"
}

# Increase timeouts to allow dealing with insert bursts
replace_option read_request_timeout_in_ms 10000
replace_option write_request_timeout_in_ms 8000
replace_option cas_contention_timeout_in_ms 8000

exec /usr/local/bin/docker-entrypoint.sh cassandra -f
