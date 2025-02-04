import { Address, beginCell, toNano } from '@ton/core';
import { convertToMerkleProof, createAltProvider, createLiteSMCMessage } from '../misc/helpers';
import { LiteClient } from '../wrappers/LiteClient';


export async function main() {
    const provider = await createAltProvider();

    const configPath = await provider.ui.input('Counterparty chain config path');
    const blockIdRepr = await provider.ui.input('Block id (wc,shard,seqno)');
    const address = Address.parse(await provider.ui.input('LiteClient contract address'));
    const liteClient = provider.client.open(LiteClient.createFromAddress(address));

    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr })

    const prunedBlock = beginCell().storeBits(block.bits)
        .storeRef(block.refs[0])
        .storeRef(convertToMerkleProof(block.refs[1]))
        .storeRef(convertToMerkleProof(block.refs[2]))
        .storeRef(convertToMerkleProof(block.refs[3]))
        .endCell();


    await liteClient.sendCheckBlock(provider.wallet.sender(provider.keyPair.secretKey), {
        block: prunedBlock,
        signatures,
        value: toNano('1'),
    });
}

main().then(() => { process.exit() }).catch((error) => { console.log(error) });
