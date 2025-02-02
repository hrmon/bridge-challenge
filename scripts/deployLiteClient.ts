import { beginCell, toNano } from '@ton/core';
import { LiteClient } from '../wrappers/LiteClient';
import { compile, NetworkProvider } from '@ton/blueprint';
import { extractValidatorSet } from '../misc/helpers';

export async function run(provider: NetworkProvider) {

    const ui = provider.ui();
    const keyBlockPath = await ui.input('Counterparty chain key block path');
    const vset = extractValidatorSet(keyBlockPath);
    const id = Math.floor(Math.random() * 10000);
    const liteClient = provider.open(
        LiteClient.createFromConfig(
            {
                id,
                vset: vset,
                keyBlocks: beginCell().endCell()
            },
            await compile('LiteClient'),
            -1
        )
    );

    await liteClient.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(liteClient.address);

    console.log('Address ', liteClient.address);
    console.log('ID', id);
}
