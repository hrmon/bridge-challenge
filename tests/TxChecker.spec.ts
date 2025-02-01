import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { TxChecker } from '../wrappers/TxChecker';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';
import { readFileSync } from 'fs';

describe('TxChecker', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TxChecker');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let txChecker: SandboxContract<TxChecker>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        txChecker = blockchain.openContract(
            TxChecker.createFromConfig(
                {
                    id: 0,
                    liteClientAddr: randomAddress(-1),
                },
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await txChecker.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: txChecker.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and txChecker are ready to use
    });

    it('should check transaction', async () => {
        const [keyBlock] = Cell.fromBoc(readFileSync('misc/key_block.boc'));
        const [transaction] = Cell.fromBoc(readFileSync('misc/tx.boc'));


        const accountKey = 23158417847463239084714197001737581570653996933128112807891516801582625927987n;
        const txKey = 30723252000001n;
        // create signature map <index in vset config> -> <signature>

        let proofCell = beginCell()
            .storeUint(accountKey, 256)
            .storeUint(txKey, 64)
            .endCell();

        //send message
        const sender = await blockchain.treasury('sender');

        const checkBlockResult = await txChecker.sendCheckTransaction(sender.getSender(), {
            transaction,
            proof: proofCell,
            currentBlock: keyBlock,
            value: toNano('0.05'),
        });

        // expect(checkBlockResult.transactions).toHaveTransaction({
        //     from: sender.address,
        //     to: txChecker.address,
        //     success: true,
        // });
    });
});
