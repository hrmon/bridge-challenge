import fs from "fs";

import { beginCell, Cell, toNano, Dictionary } from '@ton/core';
import '@ton/test-utils';
import { sha256_sync } from "@ton/crypto";


export function extractValidatorsMap(keyBlockPath: string) {

    const buf = fs.readFileSync(keyBlockPath);
    const cells = Cell.fromBoc(buf);
    const block = cells[0];
    const extra = block.refs[3]
    const mcExtra = extra.refs[3]
    const config = Dictionary.loadDirect(Dictionary.Keys.Uint(32), Dictionary.Values.Cell(), mcExtra.refs[3])

    const vset = config.get(34)!;
    const vsets = vset.beginParse()
    vsets.loadUintBig(8 + 32 + 32 + 16 + 16 + 64)
    const list = vsets.loadDict(Dictionary.Keys.Uint(16), Dictionary.Values.Buffer(1 + 4 + 32 + 8))


    // create validator map <node_id> -> <index in vset config>
    const validatorMap = new Map();
    list.keys().forEach((key) => {
        const vinfo = list.get(key)!;
        const nodeIdData = Buffer.concat([Buffer.from([0xc6, 0xb4, 0x13, 0x48]), vinfo.subarray(5, 37)]);
        const nodeId = sha256_sync(nodeIdData).toString('base64');
        validatorMap.set(nodeId, key);
        console.log(nodeId);
    });
    return validatorMap;
}