
import fs from "fs";

import { beginCell, Cell, toNano, Dictionary, Slice } from '@ton/core';
import '@ton/test-utils';
import { sha256_sync } from "@ton/crypto";
import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine, LiteEngine } from "ton-lite-client";
import { Functions, liteServer_BlockData, liteServer_getBlockProof } from "ton-lite-client/dist/schema";


export type LiteServer = {
    ip: number,
    port: number,
    id: {
        "@type": "pub.ed25519",
        key: string
    }
}

function intToIP(int: number) {
    var part1 = int & 255;
    var part2 = ((int >> 8) & 255);
    var part3 = ((int >> 16) & 255);
    var part4 = ((int >> 24) & 255);

    return part4 + "." + part3 + "." + part2 + "." + part1;
}

export function createLiteClient(liteservers: LiteServer[]) {
    const engines: LiteEngine[] = liteservers.map((server) => {
        return new LiteSingleEngine({
            host: `tcp://${intToIP(server.ip)}:${server.port}`,
            publicKey: Buffer.from(server.id.key, 'base64'),
        })
    })
    const engine: LiteEngine = new LiteRoundRobinEngine(engines);
    const client = new LiteClient({ engine });
    return { client, engine }
}



export function extractValidatorsMap(block: Cell) {

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



export function loadBlockInfo(slice: Slice) {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x9bc7a987))) {
        slice.loadUint(32);
        let version: number = slice.loadUint(32);
        let not_master: number = slice.loadUint(1);
        let after_merge: number = slice.loadUint(1);
        let before_split: number = slice.loadUint(1);
        let after_split: number = slice.loadUint(1);
        let want_split: boolean = slice.loadBoolean();
        let want_merge: boolean = slice.loadBoolean();
        let key_block: boolean = slice.loadBoolean();
        let vert_seqno_incr: number = slice.loadUint(1);
        let flags: number = slice.loadUint(8);
        let seq_no: number = slice.loadUint(32);
        let vert_seq_no: number = slice.loadUint(32);
        let shard: bigint = slice.loadUintBig(2 + 6 + 32 + 64);
        let gen_utime: number = slice.loadUint(32);
        let start_lt: number = slice.loadUint(64);
        let end_lt: number = slice.loadUint(64);
        let gen_validator_list_hash_short: number = slice.loadUint(32);
        let gen_catchain_seqno: number = slice.loadUint(32);
        let min_ref_mc_seqno: number = slice.loadUint(32);
        let prev_key_block_seqno: number = slice.loadUint(32);
        if ((!(flags <= 1))) {
            throw new Error('Condition (flags <= 1) is not satisfied while loading "BlockInfo" for type "BlockInfo"');
        }
        if ((!(vert_seq_no >= vert_seqno_incr))) {
            throw new Error('Condition (vert_seq_no >= vert_seqno_incr) is not satisfied while loading "BlockInfo" for type "BlockInfo"');
        }
        return {
            kind: 'BlockInfo',
            prev_seq_no: (seq_no - 1),
            version: version,
            not_master: not_master,
            after_merge: after_merge,
            before_split: before_split,
            after_split: after_split,
            want_split: want_split,
            want_merge: want_merge,
            key_block: key_block,
            vert_seqno_incr: vert_seqno_incr,
            flags: flags,
            seq_no: seq_no,
            vert_seq_no: vert_seq_no,
            shard: shard,
            gen_utime: gen_utime,
            start_lt: start_lt,
            end_lt: end_lt,
            gen_validator_list_hash_short: gen_validator_list_hash_short,
            gen_catchain_seqno: gen_catchain_seqno,
            min_ref_mc_seqno: min_ref_mc_seqno,
            prev_key_block_seqno: prev_key_block_seqno,
        }

    }
    throw new Error('Expected one of "BlockInfo" in loading "BlockInfo", but data does not satisfy any constructor');
}


export function extractValidatorSet(keyBlockPath: string) {
    const buf = fs.readFileSync(keyBlockPath);
    const cells = Cell.fromBoc(buf);
    const block = cells[0];
    const extra = block.refs[3];
    const mcExtra = extra.refs[3];
    const config = Dictionary.loadDirect(
        Dictionary.Keys.Uint(32),
        Dictionary.Values.Cell(),
        mcExtra.refs[3]
    );
    const vset = config.get(34)!;
    return vset;
}



export async function createLiteSMCMessage(params: { configPath: string, blockIdRepr?: string }) {
    const config = JSON.parse(fs.readFileSync(params.configPath, "utf8"));

    const { client, engine } = createLiteClient(config.liteservers)

    // get requested block id or the last block
    let blockId;
    if (params.blockIdRepr) {
        const [workchain, shard, seqno] = params.blockIdRepr.split(',');
        const blockHeader = await client.lookupBlockByID({ seqno: parseInt(seqno), shard, workchain: parseInt(workchain) })
        blockId = blockHeader.id;
    }
    else {
        const master = await client.getMasterchainInfo()
        console.log('master', master)
        blockId = master.last;
    }

    // get and load block cell
    const block = await engine.query(Functions.liteServer_getBlock, {
        kind: "liteServer.getBlock",
        id: blockId,
    });

    console.log(block);
    const [rootCell] = Cell.fromBoc(block.data);

    // get prev key block id
    const infoCell = rootCell.refs[0];
    const { prev_key_block_seqno } = loadBlockInfo(infoCell.beginParse())
    const prevKeyBlockHeader = await client.lookupBlockByID({ seqno: prev_key_block_seqno, shard: "8000000000000000", workchain: -1 })
    const prevKeyBlock = await engine.query(Functions.liteServer_getBlock, {
        kind: "liteServer.getBlock",
        id: prevKeyBlockHeader.id,
    });
    const [keyBlockCell] = Cell.fromBoc(prevKeyBlock.data);

    // extract validator map
    const validatorMap = extractValidatorsMap(keyBlockCell);
    // get block proof from prev key block
    const blockProof = await engine.query(Functions.liteServer_getBlockProof, {
        kind: "liteServer.getBlockProof",
        knownBlock: prevKeyBlockHeader.id,
        targetBlock: blockId,
        mode: 1
    });
    // load signatures and create signs cell
    if (blockProof.steps[0].kind == "liteServer.blockLinkForward") {
        const signatures = blockProof.steps[0].signatures.signatures;
        console.log(signatures)
        let signDict = Dictionary.empty(Dictionary.Keys.Uint(16), Dictionary.Values.Buffer(64));
        signatures.forEach((item) => {
            let key = validatorMap.get(item.nodeIdShort.toString('base64'));
            console.log(key);
            signDict.set(key, item.signature)
        });
        let signCell = beginCell()
            .storeBuffer(block.id.fileHash)
            .storeDict(signDict)
            .endCell();

        return { signatures: signCell, block: rootCell }
    }
    else {
        throw new Error("Signatures not found!")
    }

}


export function search(cell: Cell, target: Cell): { found: boolean, path: number[] } {
    for (const [index, child] of cell.refs.entries()) {
        if (child.hash().toString('hex') == target.hash().toString('hex')) {
            console.log(index);
            return { found: true, path: [index] };
        } else {
            const { found, path } = search(child, target);
            if (found) {
                return { found, path: [index, ...path] };
            }
        }
    }
    return { found: false, path: [] };
}


export function loadAccountBlock(slice: Slice) {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x5))) {
        slice.loadUint(4);
        let account_addr = slice.loadBits(256);
        let transactions = Dictionary.loadDirect(Dictionary.Keys.BigUint(64), {
            serialize: () => { throw new Error('Not implemented') },
            parse: ((slice: Slice) => {
                slice.loadCoins()
                slice.loadDict(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(32))
                let transactionCell = slice.loadRef()
                return transactionCell

            }),
        }, slice)
        return {
            kind: 'AccountBlock',
            account_addr: account_addr,
            transactions: transactions,
            // state_update: state_update,
        }

    }
    throw new Error('Expected one of "AccountBlock" in loading "AccountBlock", but data does not satisfy any constructor');
}

export function loadShardAccountBlocks(slice: Slice) {
    let anon0 = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
            slice.loadCoins()
            slice.loadDict(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(32))
            // console.log(slice)
            return {
                value: loadAccountBlock(slice),
            }

        }),
    }, slice);
    return {
        kind: 'ShardAccountBlocks',
        anon0: anon0,
    }

}

export function loadBlockExtra(slice: Slice) {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x4a33f6fd))) {
        slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        // let in_msg_descr: InMsgDescr = loadInMsgDescr(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        // let out_msg_descr: OutMsgDescr = loadOutMsgDescr(slice2);
        let slice3 = slice.loadRef().beginParse(true);
        let account_blocks = loadShardAccountBlocks(slice3);

        return {
            kind: 'BlockExtra',
            // in_msg_descr: in_msg_descr,
            // out_msg_descr: out_msg_descr,
            account_blocks: account_blocks,
        }

    }
}