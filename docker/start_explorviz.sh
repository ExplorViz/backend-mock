#!/bin/sh

echo "Starting ExplorViz software stack ..."

docker compose -f docker-compose.environment.yml up -d

# Remove stopped containers which initialized Kafka and Cassandra
docker rm $(docker ps -a --filter name=init-kafka -q)
docker rm $(docker ps -a --filter name=init-cassandra -q)

# Add `-n` flag to start Quarkus-native Docker containers
while getopts ":n" option; do
   case $option in
      n) echo "Starting ExplorViz native containers..."
         docker compose -f docker-compose.explorviz.native.yml up -d
         exit;;
   esac
done

# Start regular containers if `-n` is not set
echo "Add -n option to start native Quarkus containers for ExplorViz."

echo "Starting ExplorViz containers ..."
docker compose -f docker-compose.explorviz.yml up -d
