

# Trustless Bridge Challenge

## Project structure

This project uses `@ton/blueprint` SDK and its structure follows the SDK standard:

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project


## !! Using Scripts

* Install dependencies
```
npm install
```

* Set `WALLET_MNEMONIC` and `TONCENTER_APIKEY` environment variables (based on which blockchain you want to interact with).

* Execute scripts with `npx ts-node` to deploy contracts or send queries to deployed ones.
The scripts are interactive and prompts for neccesary parameters.  
For instance:
```
$ npx ts-node scripts/altDeployLiteClient.ts

? Endpoint: https://testnet.toncenter.com/api/v2/jsonRPC
? Wallet workchain: 0
? LiteClient contract address: Ef_QPIRY28E6mr3SSt1dgISCRqjYqk1KD_Dgnp1Z97tun1Zg
? Counterparty chain config path: misc/fastnet-global.config.json
? Counterparty Block id (wc,shard,seqno): -1,8000000000000000,765944
```

 


## Deployed contracts and transaction samples

|network|contract|address|tx success|tx failure|
|-|-|-|-|-|
|fastnet|Lite Client|Ef_QPIRY28E6mr3SSt1dgISCRqjYqk1KD_Dgnp1Z97tun1Zg|XwUSwOtr0P5JmA0tFEWbX1sc9h7a0Q/f6ohCYWfN9TI=|c7vde1BvvztVy1Ot2iA90P+yOvjzP5v42VoO0VEmW2M=|
|fastnet|Tx Checker|Ef-S114fb2CpcKqjgI41jxa0bIEUv9Y1U70kspQHclRx5OOo|zTBk3ik5UH3EQruZ+ld/SYLLQ7O8tijZGoR5rnZW5f0=|epAaKENo0jyScGB8Wqc1G0Y44spmzTx649ZfSmRlQ3g=|
|testnet|Lite Client|EQCs9WpDcc3ZpwSbO66CvRm5tfcSsRU3hsimw4VlVL3pqoXe|/dd95WejYLKlNRGssJUAmt7eV7vXTtIwSLLtxIyLUKI=|gI8ki3prt3nURgAH6nKhTPNEl5yj+HP6PrC/CeAsYy4=|
|testnet|Tx Checker|Ef-okM-Nvu7mLx7e4LAPuCQaC8-kas6nwGGwxOKWsz8Q5M9n|BqITfwfwO+Gd1IYcMc9/BY9jIWTNu5XmKnGtjD3k04o=|jaLsKSAp8W3OrqHzZx3SWAl6zf3y0b6lJiR7+yWYM8U=|


