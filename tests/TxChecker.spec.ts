import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, toNano } from '@ton/core';
import { TxChecker } from '../wrappers/TxChecker';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { randomAddress } from '@ton/test-utils';
import { readFileSync } from 'fs';
import { createLiteClientSignsCell, extractValidatorsMap, searchCellTree } from '../misc/helpers';

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

        deployer = await blockchain.treasury('deployer');

        txChecker = blockchain.openContract(
            TxChecker.createFromConfig(
                {
                    id: 0,
                    liteClientAddr: deployer.address,
                },
                code
            )
        );


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


        // create block cell
        const validatorMap = extractValidatorsMap(keyBlock);
        const signCell = createLiteClientSignsCell('misc/signs_key_block.json', validatorMap);
        const blockCell = beginCell().storeRef(keyBlock).storeRef(signCell).endCell();


        // construct proof as path to tx in block
        const { found, path } = searchCellTree(keyBlock, transaction);
        let proofCell = beginCell().storeUint(path.length, 16);
        path.forEach((index) => { proofCell.storeUint(index, 2) });


        //send message
        const sender = await blockchain.treasury('sender');

        // it is expensive message, 0.05 is not enouch
        const checkTxResult = await txChecker.sendCheckTransaction(sender.getSender(), {
            transaction,
            proof: proofCell.endCell(),
            currentBlock: blockCell,
            value: toNano('0.5'),
        });


        // checkBlockResult.transactions.forEach((tx) => {
        //     console.log(tx.inMessage!.info)
        //     if (tx.description.type == "generic") {
        //         console.log(tx.description.computePhase)
        //         console.log(tx.description.actionPhase)
        //     }
        //     tx.outMessages.values().forEach((msg) => {
        //         console.log(msg.info);
        //     })
        // })

        expect(checkTxResult.transactions).toHaveTransaction({
            from: sender.address,
            to: txChecker.address,
            success: true,
        });
    });
});
