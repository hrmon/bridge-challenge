import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { createLiteSMCMessage } from '../misc/helpers';
import { TLBridge } from '../wrappers/TLBridge';

export async function run(provider: NetworkProvider, args: string[]) {
    // const ui = provider.ui();

    // get smc address
    const ui = provider.ui();
    const address = Address.parse(await ui.input('TLBridge address'))
    const tLBridge = provider.open(TLBridge.createFromAddress(address));

    const configPath = args[0];
    const { signatures, block } = await createLiteSMCMessage({ configPath, blockIdRepr: args.length > 1 ? args[1] : undefined })

    await tLBridge.sendCheckBlock(provider.sender(), {
        block,
        signatures,
        value: toNano('0.05'),
    });
}

