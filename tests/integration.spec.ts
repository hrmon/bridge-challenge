import { readFileSync } from "fs";

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, toNano } from '@ton/core';
import { LiteClient } from '../wrappers/LiteClient';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { loadSignsCellfromFile, extractValidatorSet, extractValidatorsMap, searchCellTree } from "../misc/helpers";
import { TxChecker } from "../wrappers/TxChecker";


describe('integration', () => {
    let liteClientCode: Cell;
    let txCheckerCode: Cell;

    beforeAll(async () => {
        liteClientCode = await compile('LiteClient');
        txCheckerCode = await compile('TxChecker');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let liteClient: SandboxContract<LiteClient>;
    let txChecker: SandboxContract<TxChecker>;

    beforeEach(async () => {

        const vset = extractValidatorSet('tests/data/key_block.boc');

        blockchain = await Blockchain.create();

        liteClient = blockchain.openContract(
            LiteClient.createFromConfig(
                {
                    id: 0,
                    vset: vset,
                    keyBlocks: beginCell().endCell(),
                },
                liteClientCode
            )
        );
        txChecker = blockchain.openContract(
            TxChecker.createFromConfig(
                {
                    id: 0,
                    liteClientAddr: liteClient.address,
                },
                txCheckerCode
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResultLiteClient = await liteClient.sendDeploy(deployer.getSender(), toNano('0.05'));
        const deployResultTxChecker = await txChecker.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResultLiteClient.transactions).toHaveTransaction({
            from: deployer.address,
            to: liteClient.address,
            deploy: true,
            success: true,
        });
        expect(deployResultTxChecker.transactions).toHaveTransaction({
            from: deployer.address,
            to: txChecker.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and liteClient are ready to use
    });

    it('check block', async () => {
        const [keyBlock] = Cell.fromBoc(readFileSync('tests/data/key_block.boc'));
        const [transaction] = Cell.fromBoc(readFileSync('tests/data/tx.boc'));


        // create block cell
        const validatorMap = extractValidatorsMap(keyBlock);
        const signCell = loadSignsCellfromFile('tests/data/signs_key_block.json', validatorMap);
        const blockCell = beginCell().storeRef(keyBlock).storeRef(signCell).endCell();


        // construct proof as path to tx in block
        const { found, path } = searchCellTree(keyBlock, transaction);
        let proofCell = beginCell().storeUint(path.length, 16);
        path.forEach((index) => { proofCell.storeUint(index, 2) });


        //send message
        const sender = await blockchain.treasury('sender');

        const checkTxResult = await txChecker.sendCheckTransaction(sender.getSender(), {
            transaction,
            proof: proofCell.endCell(),
            currentBlock: blockCell,
            value: toNano('1'),
        });
        // console.log(sender.address)
        // console.log(liteClient.address)
        // console.log(txChecker.address)
        // checkTxResult.transactions.forEach((tx) => {
        //     console.log(tx.inMessage!.info)
        //     if (tx.description.type == "generic") {
        //         console.log(tx.description.computePhase)
        //         console.log(tx.description.actionPhase)
        //     }
        //     // tx.outMessages.values().forEach((msg) => {
        //     //     console.log(msg.info);
        //     // })
        // })
        expect(checkTxResult.transactions).toHaveTransaction({
            from: sender.address,
            to: txChecker.address,
            success: true,
        });
        expect(checkTxResult.transactions).toHaveTransaction({
            from: txChecker.address,
            to: liteClient.address,
            success: true,
        });
        expect(checkTxResult.transactions).toHaveTransaction({
            from: liteClient.address,
            to: txChecker.address,
            success: true,
            inMessageBounced: false
        });
    });
});
