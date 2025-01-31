import { beginCell, } from '@ton/core';
import { writeFileSync } from "fs";
import { createLiteSMCMessage } from '../misc/helpers';



async function main() {
    const args = process.argv.slice(2)
    console.log(args);
    const configPath = args[0];
    const blockIdRepr = args[1];
    const { block, signatures } = await createLiteSMCMessage({ configPath, blockIdRepr })
    const message = beginCell()
        .storeUint(0x11a78ffe, 32)
        .storeUint(0, 64)
        .storeRef(block)
        .storeRef(signatures)
        .endCell();
    writeFileSync("message.boc", message.toBoc());
}

main()