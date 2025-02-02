import fs from "fs";

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, toNano, Dictionary } from '@ton/core';
import { LiteClient } from '../wrappers/LiteClient';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { loadSignsCellfromFile, extractValidatorSet, extractValidatorsMap } from "../misc/helpers";


describe('LiteClient', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('LiteClient');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let liteClient: SandboxContract<LiteClient>;

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
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await liteClient.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: liteClient.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and liteClient are ready to use
    });

    it('accept new key block', async () => {

        const [keyBlock] = Cell.fromBoc(fs.readFileSync('tests/data/key_block.boc'));
        const validatorMap = extractValidatorsMap(keyBlock);

        // create signature map <index in vset config> -> <signature>
        let signCell = loadSignsCellfromFile('tests/data/signs_key_block.json', validatorMap);

        // Bag-of-cells
        const buf = fs.readFileSync('tests/data/key_block.boc');
        const cells = Cell.fromBoc(buf);
        const block = cells[0];

        //send message
        const sender = await blockchain.treasury('sender');

        const keyBlockResult = await liteClient.sendNewKeyBlock(sender.getSender(), {
            block,
            signatures: signCell,
            value: toNano('0.05'),
        });

        expect(keyBlockResult.transactions).toHaveTransaction({
            from: sender.address,
            to: liteClient.address,
            success: true,
        });
    });

    it('check block', async () => {
        const [keyBlock] = Cell.fromBoc(fs.readFileSync('tests/data/key_block.boc'));
        const validatorMap = extractValidatorsMap(keyBlock);


        // create signature map <index in vset config> -> <signature>
        let signCell = loadSignsCellfromFile('tests/data/signs_block.json', validatorMap);

        // load block
        const buf = fs.readFileSync('tests/data/block.boc');
        const cells = Cell.fromBoc(buf);
        const block = cells[0];

        //send message
        const sender = await blockchain.treasury('sender');

        const checkBlockResult = await liteClient.sendCheckBlock(sender.getSender(), {
            block,
            signatures: signCell,
            value: toNano('0.05'),
        });

        expect(checkBlockResult.transactions).toHaveTransaction({
            from: sender.address,
            to: liteClient.address,
            success: true,
        });
    });
});
