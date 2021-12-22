// import fs from 'fs';
import * as util from 'util';
import t2lib, { Errors } from '../index';
// console.log(util.inspect(myObject, false, null, true));
// console.log(util.inspect(myObject, {showHidden: false, depth: null, colors: true}))

describe('Testing transaction classes', () => {
    // let bpPath = '/home/alex/Scrivania/t2/trinci-node/bootstrap.wasm';
    // let bpBin = fs.readFileSync(bpPath);
    // let bpHash = t2lib.Utils.sha256(new Uint8Array(bpBin));
    // let bpHashB58 = t2lib.binConversions.arrayBufferToBase58(bpHash.buffer);
    // let scRef = `1220${Buffer.from(bpHash).toString('hex')}`;

    // let nodeUrl = 'http://localhost:8000';
    // let nodeNet = 'bootstrap';
    // let c = new t2lib.Client(url, network);
    const acc1 = new t2lib.Account();

    it('init', async () => {
        await acc1.generate();
    }, 30000);

    it('UnitaryTransaction', async () => {
        const tx1 = new t2lib.UnitaryTransaction();
        tx1.data.dependsOn
        await tx1.sign(acc1.keyPair.privateKey);
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        let tx1Ticket = await tx1.getTicket();

        const tx2 = new t2lib.UnitaryTransaction();
        await tx2.fromBase58(tx1B58);
        let tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeTruthy();
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeFalsy();
        await tx2.fromObject(tx1Obj);
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeTruthy();
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeFalsy();

        const tx3 = new t2lib.BaseTransaction();
        await tx3.fromBase58(tx1B58);
        let tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeTruthy();
        tx3.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeFalsy();
        await tx3.fromObject(tx1Obj);
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeTruthy();
        tx3.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeFalsy();

        console.log(util.inspect(await tx3.toUnnamedObject(), false, null, true));
    }, 30000);

    it('bulkRootTransaction', async () => {
        const tx1 = new t2lib.BulkRootTransaction();
        tx1.data.dependsOn
        await expect(tx1.sign(acc1.keyPair.privateKey)).rejects.toEqual(new Error(t2lib.Errors.BULK_ROOT_TX_NO_SIGN));
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        let tx1Ticket = await tx1.getTicket();

        const tx2 = new t2lib.BulkRootTransaction();
        await tx2.fromBase58(tx1B58);
        let tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).rejects.toEqual(new Error(t2lib.Errors.BULK_ROOT_TX_NO_VERIFY));
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await tx2.fromObject(tx1Obj);
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);

        const tx3 = new t2lib.BaseTransaction();
        await tx3.fromBase58(tx1B58);
        let tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).rejects.toEqual(new Error(t2lib.Errors.NO_BASE_KEY_VALUE));
        tx3.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await tx3.fromObject(tx1Obj);
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        tx3.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
    }, 30000);

    it('bulkNodeTransaction', async () => {
        const tx1 = new t2lib.BulkNodeTransaction();
        tx1.data.dependsOn
        await tx1.sign(acc1.keyPair.privateKey);
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        let tx1Ticket = await tx1.getTicket();

        const tx2 = new t2lib.BulkNodeTransaction();
        await tx2.fromBase58(tx1B58);
        let tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeTruthy();
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeFalsy();
        await tx2.fromObject(tx1Obj);
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeTruthy();
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeFalsy();

        const tx3 = new t2lib.BaseTransaction();
        await tx3.fromBase58(tx1B58);
        let tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeTruthy();
        tx3.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeFalsy();
        await tx3.fromObject(tx1Obj);
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeTruthy();
        tx3.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeFalsy();
    }, 30000);
});
