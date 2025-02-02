import { beginCell, toNano } from '@ton/core';
import { LiteClient } from '../wrappers/LiteClient';
import { compile } from '@ton/blueprint';
import { createAltProvider, extractValidatorSet, waitForDeploy } from '../misc/helpers';


export async function main() {
    const provider = await createAltProvider();

    const keyBlockPath = await provider.ui.input('Counterparty chain key block path');
    const vset = extractValidatorSet(keyBlockPath);
    const id = Math.floor(Math.random() * 10000);
    const liteClient = provider.client.open(
        LiteClient.createFromConfig(
            {
                id,
                vset: vset,
                keyBlocks: beginCell().endCell()
            },
            await compile('LiteClient'),
            provider.workchain
        )
    );

    await liteClient.sendDeploy(provider.wallet.sender(provider.keyPair.secretKey), toNano('0.5'));

    await waitForDeploy(liteClient.address, provider);

    console.log('Address ', liteClient.address);
    console.log('ID', id);
}

main().then(() => { process.exit() }).catch((error) => { console.log(error); });
