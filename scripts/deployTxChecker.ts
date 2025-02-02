import { Address, toNano } from '@ton/core';
import { TxChecker } from '../wrappers/TxChecker';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const liteClientAddress = await ui.input('LiteClient address');
    const id = Math.floor(Math.random() * 10000);
    const txChecker = provider.open(
        TxChecker.createFromConfig(
            {
                id,
                liteClientAddr: Address.parse(liteClientAddress),
            },
            await compile('TxChecker'),
            -1
        )
    );

    await txChecker.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(txChecker.address);

    console.log('Address ', txChecker.address);
    console.log('ID ', id);
}
