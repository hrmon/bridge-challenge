import { Address, beginCell, toNano } from '@ton/core';
import { TxChecker } from '../wrappers/TxChecker';
import { NetworkProvider } from '@ton/blueprint';
import { createLiteSMCMessage, retrieveTransaction, searchCellTree } from '../misc/helpers';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const configPath = await ui.input('Counterparty chain config path');
    const blockIdRepr = await ui.input('Transaction block id');

    // TODO: TonClient.getContractState
    const txAccountAddress = await ui.input('Transaction account address');
    const txLogicalTime = await ui.input('Transaction LT');
    const { txCell } = await retrieveTransaction(configPath,
        { blockIdRepr, address: txAccountAddress, logicalTime: txLogicalTime })
    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr })

    // construct proof as path to tx in block
    const { found, path } = searchCellTree(block, txCell);
    console.log(path);
    let proofCell = beginCell().storeUint(path.length, 16);
    path.forEach((index) => { proofCell.storeUint(index, 2) });

    // send message
    const address = Address.parse(await ui.input('TxChecker address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const txChecker = provider.open(TxChecker.createFromAddress(address));

    await txChecker.sendCheckTransaction(provider.sender(), {
        transaction: txCell,
        proof: proofCell.endCell(),
        currentBlock: beginCell().storeRef(block).storeRef(signatures).endCell(),
        value: toNano('0.05'),
    });

    ui.write('Check Requested...');
}
