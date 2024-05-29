#!/bin/sh

echo -e 'Creating kafka topics'

kafka-topics --bootstrap-server kafka:${KAFKA_INT_PORT} --create --if-not-exists --topic otlp_spans --replication-factor 1 --partitions 20

kafka-topics --bootstrap-server kafka:${KAFKA_INT_PORT} --create --if-not-exists --topic explorviz-spans --replication-factor 1 --partitions 20


kafka-topics --bootstrap-server kafka:${KAFKA_INT_PORT} --create --if-not-exists --topic token-events --replication-factor 1 --partitions 20

kafka-topics --bootstrap-server kafka:${KAFKA_INT_PORT} --create --if-not-exists --topic token-events-table --replication-factor 1 --partitions 20

echo -e 'Successfully created the following topics:'
kafka-topics --bootstrap-server kafka:${KAFKA_INT_PORT} --list
