import { beginCell, toNano } from '@ton/core';
import { LiteClient } from '../wrappers/LiteClient';
import { compile, NetworkProvider } from '@ton/blueprint';
import { extractValidatorSet } from '../misc/helpers';

export async function run(provider: NetworkProvider) {


    const vset = extractValidatorSet('misc/key_block.boc');
    const liteClient = provider.open(
        LiteClient.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                vset: vset,
                keyBlocks: beginCell().endCell()
            },
            await compile('LiteClient')
        )
    );

    await liteClient.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(liteClient.address);

    console.log('ID', await liteClient.getID());
}
