import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode } from '@ton/core';

export type TxCheckerConfig = {
    id: number;
    liteClientAddr: Address;
};

export function txCheckerConfigToCell(config: TxCheckerConfig): Cell {
    return beginCell()
        .storeUint(config.id, 32)
        .storeAddress(config.liteClientAddr)
        .storeDict(Dictionary.empty())
        .endCell();
}

export const Opcodes = {
    checkTransaction: 0x91d555f7,
};

export class TxChecker implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) { }

    static createFromAddress(address: Address) {
        return new TxChecker(address);
    }

    static createFromConfig(config: TxCheckerConfig, code: Cell, workchain = 0) {
        const data = txCheckerConfigToCell(config);
        const init = { code, data };
        return new TxChecker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCheckTransaction(
        provider: ContractProvider,
        via: Sender,
        opts: {
            transaction: Cell;
            proof: Cell;
            currentBlock: Cell;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.checkTransaction, 32)
                .storeRef(opts.transaction)
                .storeRef(opts.proof)
                .storeRef(opts.currentBlock)
                .endCell(),
        });
    }

    async getID(provider: ContractProvider) {
        const result = await provider.get('get_id', []);
        return result.stack.readNumber();
    }
}
