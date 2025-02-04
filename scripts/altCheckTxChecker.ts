import { Address, beginCell, toNano } from '@ton/core';
import { convertToMerkleProof, createAltProvider, createLiteSMCMessage, retrieveTransaction, searchCellTree, waitForDeploy } from '../misc/helpers';
import { TxChecker } from '../wrappers/TxChecker';


export async function main() {
    const provider = await createAltProvider();

    const configPath = await provider.ui.input('Counterparty chain config path');
    const blockIdRepr = await provider.ui.input('Transaction block id (wc,shard,seqno)');

    // TODO: TonClient.getContractState
    const txAccountAddress = await provider.ui.input('Transaction account address');
    const txLogicalTime = await provider.ui.input('Transaction LT');
    const { txCell } = await retrieveTransaction(configPath,
        { blockIdRepr, address: txAccountAddress, logicalTime: txLogicalTime })
    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr })

    // prune block
    const prunedBlock = beginCell().storeBits(block.bits)
        .storeRef(block.refs[0])
        .storeRef(convertToMerkleProof(block.refs[1]))
        .storeRef(convertToMerkleProof(block.refs[2]))
        .storeRef(block.refs[3])
        .endCell();

    // construct proof as path to tx in block
    const { found, path } = searchCellTree(block, txCell);
    console.log(path);
    let proofCell = beginCell().storeUint(path.length, 16);
    path.forEach((index) => { proofCell.storeUint(index, 2) });

    // send message
    const address = Address.parse(await provider.ui.input('TxChecker address'));
    const txChecker = provider.client.open(TxChecker.createFromAddress(address));

    await txChecker.sendCheckTransaction(provider.wallet.sender(provider.keyPair.secretKey), {
        transaction: convertToMerkleProof(txCell),
        proof: proofCell.endCell(),
        currentBlock: beginCell().storeRef(prunedBlock).storeRef(signatures).endCell(),
        value: toNano('4'),
    });

    provider.ui.write('Check Requested...');
}

main().then(() => { process.exit() }).catch((error) => { console.log(error); });
