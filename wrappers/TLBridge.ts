import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type TLBridgeConfig = {
    id: number;
    vset: Cell;
    keyBlocks: Cell;
};

export function tLBridgeConfigToCell(config: TLBridgeConfig): Cell {
    return beginCell().storeUint(config.id, 32).storeRef(config.vset).storeRef(config.keyBlocks).endCell();
}

export const Opcodes = {
    increase: 0x7e8764ef,
    newKeyBlock: 0x11a78ffe,
    checkBlock: 0x8eaa9d76,
};

export class TLBridge implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new TLBridge(address);
    }

    static createFromConfig(config: TLBridgeConfig, code: Cell, workchain = 0) {
        const data = tLBridgeConfigToCell(config);
        const init = { code, data };
        return new TLBridge(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendIncrease(
        provider: ContractProvider,
        via: Sender,
        opts: {
            increaseBy: number;
            value: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.increase, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeUint(opts.increaseBy, 32)
                .endCell(),
        });
    }

    async sendNewKeyBlock(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint,
            block: Cell;
            signatures: Cell;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.newKeyBlock, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.block)
                .storeRef(opts.signatures)
                .endCell(),
        });
    }

    async sendCheckBlock(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint,
            block: Cell;
            signatures: Cell;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.newKeyBlock, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeRef(opts.block)
                .storeRef(opts.signatures)
                .endCell(),
        });
    }

    async getCounter(provider: ContractProvider) {
        const result = await provider.get('get_counter', []);
        return result.stack.readNumber();
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }
}
