import { Address, beginCell, toNano } from '@ton/core';
import { LiteClient } from '../wrappers/LiteClient';
import { compile } from '@ton/blueprint';
import { createAltProvider, extractValidatorSet, waitForDeploy } from '../misc/helpers';
import { TxChecker } from '../wrappers/TxChecker';


export async function main() {
    const provider = await createAltProvider();

    const liteClientAddress = await provider.ui.input('LiteClient address');
    const id = Math.floor(Math.random() * 10000);
    const txChecker = provider.client.open(
        TxChecker.createFromConfig(
            {
                id,
                liteClientAddr: Address.parse(liteClientAddress),
            },
            await compile('TxChecker'),
            -1
        )
    );

    await txChecker.sendDeploy(provider.wallet.sender(provider.keyPair.secretKey), toNano('0.05'));

    await waitForDeploy(txChecker.address, provider);

    console.log('Address ', txChecker.address);
    console.log('ID ', id);
}

main().then(() => { process.exit() });
