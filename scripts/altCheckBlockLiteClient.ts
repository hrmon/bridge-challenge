import { Address, toNano } from '@ton/core';
import { createAltProvider, createLiteSMCMessage } from '../misc/helpers';
import { LiteClient } from '../wrappers/LiteClient';


export async function main() {
    const provider = await createAltProvider();

    const configPath = await provider.ui.input('Counterparty chain config path');
    const blockIdRepr = await provider.ui.input('Block id (wc,shard,seqno)');
    const address = Address.parse(await provider.ui.input('LiteClient contract address'));
    const liteClient = provider.client.open(LiteClient.createFromAddress(address));

    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr })

    await liteClient.sendCheckBlock(provider.wallet.sender(provider.keyPair.secretKey), {
        block,
        signatures,
        value: toNano('0.5'),
    });
}

main().then(() => { process.exit() }).catch((error) => { console.log(error) });
