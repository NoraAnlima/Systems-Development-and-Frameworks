#!/bin/bash

SCRIPT_PATH="$( cd "$(dirname "$0")" ; pwd -P )"
ROOT_PATH="$(realpath "$SCRIPT_PATH"/..)"
NEO4J_PATH=$ROOT_PATH/neo4j

mkdir $NEO4J_PATH

# todo: maybe we should move the data dirs to the git root dir and change the owner to the local owner?

docker run \
    --name todo_neo4j \
    -p7474:7474 -p7687:7687 \
    -d \
    -v $NEO4J_PATH/data:/data \
    -v $NEO4J_PATH/logs:/logs \
    -v $NEO4J_PATH/import:/var/lib/neo4j/import \
    -v $NEO4J_PATH/plugins:/plugins \
    --env NEO4J_AUTH=neo4j/test \
    neo4j:latest
