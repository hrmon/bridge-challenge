import { beginCell, toNano } from '@ton/core';
import { TLBridge } from '../wrappers/TLBridge';
import { compile, NetworkProvider } from '@ton/blueprint';
import { extractValidatorSet } from '../misc/helpers';

export async function run(provider: NetworkProvider) {


    const vset = extractValidatorSet('misc/key_block.boc');
    const tLBridge = provider.open(
        TLBridge.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                vset: vset,
                keyBlocks: beginCell().endCell()
            },
            await compile('TLBridge')
        )
    );

    await tLBridge.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tLBridge.address);

    console.log('ID', await tLBridge.getID());
}
