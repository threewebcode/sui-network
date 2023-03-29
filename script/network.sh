#!/usr/bin/env bash

function sui(){
    git clone https://github.com/MystenLabs/sui.git
    cd sui
    cargo build --bin sui-test-validator --bin sui
}

$@