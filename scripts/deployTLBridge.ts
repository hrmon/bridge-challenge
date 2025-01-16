import { toNano } from '@ton/core';
import { TLBridge } from '../wrappers/TLBridge';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tLBridge = provider.open(
        TLBridge.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('TLBridge')
        )
    );

    await tLBridge.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(tLBridge.address);

    console.log('ID', await tLBridge.getID());
}
