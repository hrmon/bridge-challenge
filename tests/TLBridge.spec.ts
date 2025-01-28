import fs from "fs";

import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, toNano } from '@ton/core';
import { TLBridge } from '../wrappers/TLBridge';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('TLBridge', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TLBridge');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tLBridge: SandboxContract<TLBridge>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        tLBridge = blockchain.openContract(
            TLBridge.createFromConfig(
                {
                    id: 0,
                    vset: beginCell().endCell(),
                    keyBlocks: beginCell().endCell(),
                },
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await tLBridge.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tLBridge.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and tLBridge are ready to use
    });

    // it('should increase counter', async () => {
    //     const increaseTimes = 3;
    //     for (let i = 0; i < increaseTimes; i++) {
    //         console.log(`increase ${i + 1}/${increaseTimes}`);

    //         const increaser = await blockchain.treasury('increaser' + i);

    //         const counterBefore = await tLBridge.getCounter();

    //         console.log('counter before increasing', counterBefore);

    //         const increaseBy = Math.floor(Math.random() * 100);

    //         console.log('increasing by', increaseBy);

    //         const increaseResult = await tLBridge.sendIncrease(increaser.getSender(), {
    //             increaseBy,
    //             value: toNano('0.05'),
    //         });

    //         expect(increaseResult.transactions).toHaveTransaction({
    //             from: increaser.address,
    //             to: tLBridge.address,
    //             success: true,
    //         });

    //         const counterAfter = await tLBridge.getCounter();

    //         console.log('counter after increasing', counterAfter);

    //         expect(counterAfter).toBe(counterBefore + increaseBy);
    //     }
    // });

    it('load config 32', async () => {
        const buf = fs.readFileSync('block.boc'); 
        // load a list of cells
        const cells = Cell.fromBoc(buf);
        // get first cell
        const block = cells[0];


        const increaser = await blockchain.treasury('increaser');

        const increaseResult = await tLBridge.sendNewKeyBlock(increaser.getSender(), {
            block,
            signatures: beginCell().endCell(),
            value: toNano('0.05'),
        });

        expect(increaseResult.transactions).toHaveTransaction({
            from: increaser.address,
            to: tLBridge.address,
            success: true,
        });

    });
});
