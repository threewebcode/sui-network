#!/usr/bin/env bash

curl --location --request POST 'https://faucet.devnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{
    "FixedAmountRequest": {
        "recipient": "0x5ebd1ba93614508fcdaa3e23832e9c22d554463d77c64a7479d95e24e8bc5ae5"
    }
}'
