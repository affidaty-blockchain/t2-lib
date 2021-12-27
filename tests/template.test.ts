import fs from 'fs';
// import * as util from 'util';
import t2lib from '../index';
import { BulkTxData } from '../src/transaction/bulkTxData';
// console.log(util.inspect(myObject, false, null, true));
// console.log(util.inspect(myObject, {showHidden: false, depth: null, colors: true}))

describe('Testing transaction classes', () => {
    const bpPath = '/home/alex/Scrivania/t2/trinci-node/bootstrap.wasm';
    const bpBin = fs.readFileSync(bpPath);
    const bpHash = t2lib.Utils.sha256(new Uint8Array(bpBin));
    // const bpHashB58 = t2lib.binConversions.arrayBufferToBase58(bpHash.buffer);
    const scRefHex = `1220${Buffer.from(bpHash).toString('hex')}`;

    const nodeUrl = 'http://localhost:8000';
    const nodeNet = 'bootstrap';
    const c = new t2lib.Client(nodeUrl, nodeNet);
    const acc1 = new t2lib.Account();

    it('init', async () => {
        await acc1.generate();
    }, 30000);

    it('test', async () => {
        let tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = 'TRINCI';
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = 'bootstrap';
        tx.data.smartContractHashHex = scRefHex;
        tx.data.smartContractMethod = 'init';
        // tx.data.smartContractMethodArgsBytes = new Uint8Array(bpBin);
        tx.data.smartContractMethodArgs = [];
        await tx.sign(acc1.keyPair.privateKey);
        // console.log(await tx.toUnnamedObject());

        // console.log(await tx.verify());

        const ticket = await c.submitTx(tx);
        console.log(`TICKET: ${ticket}`);
        const rec = await c.waitForTicket(ticket);
        console.log(rec);
    }, 30000);

    // it('UnitaryTransaction', async () => {
    //     const tx1 = new t2lib.UnitaryTransaction();
    //     await tx1.sign(acc1.keyPair.privateKey);
    //     const tx1B58 = await tx1.toBase58();
    //     const tx1Obj = await tx1.toObject();
    //     const tx1Ticket = await tx1.getTicket();

    //     const tx2 = new t2lib.UnitaryTransaction();
    //     await tx2.fromBase58(tx1B58);
    //     let tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeTruthy();
    //     tx2.data.networkName = 'testVal';
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeFalsy();
    //     await tx2.fromObject(tx1Obj);
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeTruthy();
    //     tx2.data.networkName = 'testVal';
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeFalsy();

    //     const tx3 = new t2lib.Transaction();
    //     await tx3.fromBase58(tx1B58);
    //     let tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeTruthy();
    //     tx3.data.networkName = 'testVal';
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeFalsy();
    //     await tx3.fromObject(tx1Obj);
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeTruthy();
    //     tx3.data.networkName = 'testVal';
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeFalsy();

    //     // console.log(util.inspect(await tx3.toUnnamedObject(), false, null, true));
    // }, 30000);

    // it('bulkRootTransaction', async () => {
    //     const tx1 = new t2lib.BulkRootTransaction();
    //     await expect(
    //         tx1.sign(
    //             acc1.keyPair.privateKey,
    //         ),
    //     ).rejects.toEqual(new Error(t2lib.Errors.BULK_ROOT_TX_NO_SIGN));
    //     const tx1B58 = await tx1.toBase58();
    //     const tx1Obj = await tx1.toObject();
    //     const tx1Ticket = await tx1.getTicket();

    //     const tx2 = new t2lib.BulkRootTransaction();
    //     await tx2.fromBase58(tx1B58);
    //     let tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).toEqual(tx1Ticket);
    //     await expect(tx2.verify()).rejects.toEqual(new Error(t2lib.Errors.BULK_ROOT_TX_NO_VERIFY));
    //     tx2.data.networkName = 'testVal';
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).not.toEqual(tx1Ticket);
    //     await tx2.fromObject(tx1Obj);
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).toEqual(tx1Ticket);
    //     tx2.data.networkName = 'testVal';
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).not.toEqual(tx1Ticket);

    //     const tx3 = new t2lib.Transaction();
    //     await tx3.fromBase58(tx1B58);
    //     let tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).toEqual(tx1Ticket);
    //     await expect(tx3.verify()).rejects.toEqual(new Error(t2lib.Errors.NO_BASE_KEY_VALUE));
    //     tx3.data.networkName = 'testVal';
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).not.toEqual(tx1Ticket);
    //     await tx3.fromObject(tx1Obj);
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).toEqual(tx1Ticket);
    //     tx3.data.networkName = 'testVal';
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).not.toEqual(tx1Ticket);
    // }, 30000);

    // it('bulkNodeTransaction', async () => {
    //     const tx1 = new t2lib.BulkNodeTransaction();
    //     tx1.data.dependsOnHex = 'aabbccddeeff';
    //     await tx1.sign(acc1.keyPair.privateKey);
    //     const tx1B58 = await tx1.toBase58();
    //     const tx1Obj = await tx1.toObject();
    //     const tx1Ticket = await tx1.getTicket();

    //     const tx2 = new t2lib.BulkNodeTransaction();
    //     await tx2.fromBase58(tx1B58);
    //     let tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeTruthy();
    //     tx2.data.networkName = 'testVal';
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeFalsy();
    //     await tx2.fromObject(tx1Obj);
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeTruthy();
    //     tx2.data.networkName = 'testVal';
    //     tx2Ticket = await tx2.getTicket();
    //     expect(tx2Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx2.verify()).resolves.toBeFalsy();

    //     const tx3 = new t2lib.Transaction();
    //     await tx3.fromBase58(tx1B58);
    //     let tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeTruthy();
    //     tx3.data.networkName = 'testVal';
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeFalsy();
    //     await tx3.fromObject(tx1Obj);
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeTruthy();
    //     tx3.data.networkName = 'testVal';
    //     tx3Ticket = await tx3.getTicket();
    //     expect(tx3Ticket).not.toEqual(tx1Ticket);
    //     await expect(tx3.verify()).resolves.toBeFalsy();
    // }, 30000);

    // it('bulkTransaction', async () => {
    //     let root = new t2lib.BulkRootTransaction();
    //     root.data.accountId = 'root';
    //     let node1 = new t2lib.BulkNodeTransaction();
    //     node1.data.accountId = 'node1';
    //     node1.data.dependsOnHex = await node1.getTicket();
    //     let node2 = new t2lib.BulkNodeTransaction();
    //     node2.data.accountId = 'node2';
    //     node2.data.dependsOnHex = await node1.getTicket();
    //     let test = new t2lib.BulkTransaction();
    //     test.data.root = root;
    //     test.data.nodes.push(node1);
    //     test.data.nodes.push(node2);
    //     await test.sign(acc1.keyPair.privateKey);
    //     let testObj = await test.toBase58();
    //     let hex = t2lib.binConversions.base58ToBuffer(testObj).toString('hex');
    //     // WRONG SCHEMA!!!
    //     console.log(hex);
    //     let test2 = new BulkTxData();
    //     await test2.fromObject(testObj);
    //     console.log(test2);
    // }, 30000);
});
