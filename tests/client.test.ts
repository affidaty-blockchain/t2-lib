import fs from 'fs';
import path from 'path';
import t2lib from '../index';

describe('Testing transaction classes', () => {
    const nodeBootstrapPath = '/home/alex/Scrivania/t2/trinci-node/bootstrap.wasm';
    const testSmartContractPath = path.resolve(__dirname, './test.wasm');
    const nodeUrl = 'http://localhost:8000';
    const nodeNet = 'bootstrap';
    const client = new t2lib.Client(nodeUrl, nodeNet);
    const acc1 = new t2lib.Account();
    const acc2 = new t2lib.Account();
    let testScRefHex = '';

    it('init', async () => {
        await acc1.generate();
        await acc2.generate();
    }, 30000);

    it('bootstrap initialization', async () => {
        const bpBin = fs.readFileSync(nodeBootstrapPath);
        const bpHash = t2lib.Utils.sha256(new Uint8Array(bpBin));
        const bpHashB58 = t2lib.binConversions.arrayBufferToBase58(bpHash.buffer);
        const bpRefHex = `1220${Buffer.from(bpHash).toString('hex')}`;

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = client.serviceAccount;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = 'bootstrap';
        tx.data.smartContractHashHex = bpRefHex;
        tx.data.smartContractMethod = 'init';
        tx.data.smartContractMethodArgsBytes = new Uint8Array(bpBin);
        await tx.sign(acc1.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        const rec = await client.waitForTicket(ticket);
        expect(rec.success).toBeTruthy();

        await client.autoDetectSettings();
        expect(client.network).toEqual(bpHashB58);
        // console.log(await client.getBlockchainSettings());

        const serviceAccData = await client.accountData(client.serviceAccount);
        expect(serviceAccData.contractHash).toEqual(bpRefHex);
    }, 30000);

    it('test smart contract publish', async () => {
        await client.autoDetectSettings();
        const scBin = fs.readFileSync(testSmartContractPath);
        const scHash = t2lib.Utils.sha256(new Uint8Array(scBin));
        testScRefHex = `1220${Buffer.from(scHash).toString('hex')}`;

        const args = {
            name: 'testSc',
            version: '1.0.1',
            description: 'Just a test smart contract',
            url: 'https://www.example.net/',
            bin: scBin,
        };

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = client.serviceAccount;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = client.network;
        tx.data.smartContractHashHex = '';
        tx.data.smartContractMethod = 'contract_registration';
        tx.data.smartContractMethodArgs = args;
        await tx.sign(acc1.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        const rec = await client.waitForTicket(ticket, 10, 2000);
        expect(rec.success).toBeTruthy();
        const serviceAccData = await client.accountData(client.serviceAccount, ['*']);
        const serviceAccKeys: string[] = t2lib.Utils.bytesToObject(serviceAccData.requestedData[0]);
        expect(serviceAccKeys.indexOf(`contracts:code:${testScRefHex}`)).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('test unitary transaction', async () => {
        await client.autoDetectSettings();

        const argsBytes = new Uint8Array([0xff, 0x00, 0xff]);

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = acc2.accountId;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = client.network;
        tx.data.smartContractHashHex = testScRefHex;
        tx.data.smartContractMethod = 'test';
        tx.data.smartContractMethodArgsBytes = argsBytes;
        await tx.sign(acc2.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        const rec = await client.waitForTicket(ticket, 10, 2000);
        expect(rec.success).toBeTruthy();
        expect(rec.result).toEqual(new Uint8Array([0xc0]));
        const accData = await client.accountData(acc2);
        expect(accData.contractHash).toEqual(testScRefHex);
    }, 30000);

    it('test bulk transaction', async () => {
        // await client.autoDetectSettings();

        const argsBytes = new Uint8Array([0xff, 0x00, 0xff]);

        const rootTx = new t2lib.BulkRootTransaction();
        rootTx.data.accountId = acc2.accountId;
        rootTx.data.maxFuel = 0;
        rootTx.data.genNonce();
        rootTx.data.networkName = client.network;
        rootTx.data.smartContractHashHex = testScRefHex;
        rootTx.data.smartContractMethod = 'test';
        rootTx.data.smartContractMethodArgsBytes = argsBytes;
        rootTx.data.signerPublicKey = acc2.keyPair.publicKey;
        const rootTxTicket = await rootTx.getTicket();

        const nodeTx0 = new t2lib.BulkNodeTransaction();
        nodeTx0.data.accountId = acc2.accountId;
        nodeTx0.data.maxFuel = 0;
        nodeTx0.data.genNonce();
        nodeTx0.data.networkName = client.network;
        nodeTx0.data.smartContractHashHex = testScRefHex;
        nodeTx0.data.smartContractMethod = 'test';
        nodeTx0.data.smartContractMethodArgsBytes = argsBytes;
        nodeTx0.data.dependsOnHex = rootTxTicket;
        await nodeTx0.sign(acc2.keyPair.privateKey);

        const bulkTx = new t2lib.BulkTransaction();
        bulkTx.data.root = rootTx;
        bulkTx.data.nodes.push(nodeTx0);
        await bulkTx.sign(acc2.keyPair.privateKey);
        await expect(bulkTx.verify()).resolves.toBeTruthy();

        const ticket = await client.submitTx(bulkTx);
        await expect(bulkTx.getTicket()).resolves.toEqual(ticket);
        const rec = await client.waitForTicket(ticket, 10, 2000);
        expect(rec.success).toBeTruthy();
        const accData = await client.accountData(acc2);
        expect(accData.contractHash).toEqual(testScRefHex);
    }, 30000);
});
