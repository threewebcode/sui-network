#!/usr/bin/env bash

sudo apt update
sudo apt install postgresql-client -y

commands=('docker' 'curl' 'git' 'cargo' 'jq' 'tr')

for cli in "${commands[@]}"; do
    if ! command -v $cli &> /dev/null; then
        echo "Please install $cli"
        exit
    fi
done

SUI_RPC_HOST="https://fullnode.testnet.sui.io:443"

function get_version(){
    curl --location --request POST $SUI_RPC_HOST \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "rpc.discover",
    "params":[]
    }' | jq .result.info.version | tr -d \"
}

function get_latest_number(){
    curl --location --request POST $SUI_RPC_HOST \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sui_getLatestCheckpointSequenceNumber",
    "params":[]
    }' | jq .result | tr -d \"    
}

GIT_VERSION="testnet-$(get_version)"
SN=$(get_latest_number)

if [[ $GIT_VERSION == "testnet-" ]]; then
    sleep 2s;
    GIT_VERSION="testnet-$(get_version)"
    SN=$(get_latest_number)
fi

if [[ $GIT_VERSION == "testnet-" ]]; then
    echo "$SUI_RPC_HOST is not available"
    exit
fi

SN=$((SN-100))
echo $GIT_VERSION

git clone -b $GIT_VERSION https://github.com/MystenLabs/sui.git && cd sui

INDEX_DIR="crates/sui-indexer"
DOCKER_DIR="docker/fullnode-x"
if [[ -e "$INDEX_DIR" && -e "$DOCKER_DIR" ]]; then
    cd $INDEX_DIR
    cargo install diesel_cli --no-default-features --features postgres
    cd -
    cd $DOCKER_DIR;
    docker compose up postgres -d
    sleep 5s
    export PGPASSWORD="admin"
    psql -U postgres -p 5432 -h localhost -c 'create database sui_indexer_testnet'
    DB="postgres://postgres:admin@localhost:5432/sui_indexer_testnet"
    cd -
    cd $INDEX_DIR
    diesel setup --database-url=$DB
    find . -name 'checkpoint_handler.rs' -exec sed -i "156s/1/$SN/" {} \; 
    cargo run --bin sui-indexer -- --db-url $DB --rpc-client-url $SUI_RPC_HOST
fi
