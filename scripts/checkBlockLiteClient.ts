import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { createLiteSMCMessage } from '../misc/helpers';
import { LiteClient } from '../wrappers/LiteClient';

export async function run(provider: NetworkProvider) {
    // get smc address
    const ui = provider.ui();
    const configPath = await ui.input('Counterparty chain config path');
    const address = Address.parse(await ui.input('LiteClient address'));
    const blockIdRepr = await ui.input('Transaction block id');
    const liteClient = provider.open(LiteClient.createFromAddress(address));

    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr })

    await liteClient.sendCheckBlock(provider.sender(), {
        block,
        signatures,
        value: toNano('0.05'),
    });
}

