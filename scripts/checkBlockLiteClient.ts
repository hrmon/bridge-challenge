import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { createLiteSMCMessage } from '../misc/helpers';
import { LiteClient } from '../wrappers/LiteClient';

export async function run(provider: NetworkProvider, args: string[]) {
    // const ui = provider.ui();

    // get smc address
    const ui = provider.ui();
    const address = Address.parse(await ui.input('LiteClient address'))
    const liteClient = provider.open(LiteClient.createFromAddress(address));

    const configPath = args[0];
    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr: args.length > 1 ? args[1] : undefined })

    await liteClient.sendCheckBlock(provider.sender(), {
        block,
        signatures,
        value: toNano('0.05'),
    });
}

