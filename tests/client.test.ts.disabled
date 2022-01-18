import fs from 'fs';
import path from 'path';
import t2lib, { ECDSAKey } from '../index';

// This test needs a bit of preparation. First of all make sure you have a node with service
// account up and running. Set the correct network name in the configuration below.
// In order to publish test smart contract you wil need one of three conditions satisfied:
// a) set a special parameter in service smart contract before lauching trinci network so
// everyone can publish;
// b) Make ofe of the admins preauthorize hash of the test smart contract;
// c) import and use an admin private key to sign publish transaction (see below).

describe('Testing transaction classes', () => {
    const testScPath = path.resolve(__dirname, './test.wasm');
    const testBin = fs.readFileSync(testScPath);
    const testHashBin = t2lib.Utils.sha256(new Uint8Array(testBin));
    const testMultiHashHex = `1220${Buffer.from(testHashBin).toString('hex')}`;

    const nodeUrl = 'http://localhost:8000';
    const nodeNet = '<network name>';
    const client = new t2lib.Client(nodeUrl, nodeNet);
    const acc1 = new t2lib.Account();
    const acc2 = new t2lib.Account();
    const publisherAcc = new t2lib.Account();

    it('variables generation and initialization', async () => {
        // Here you can comment the next account generation line and uncomment private key import
        // to be able to publish test smart contract
        await publisherAcc.generate();
        // const adminPrivKey = new ECDSAKey('private');
        // await adminPrivKey.setPKCS8(new Uint8Array(Buffer.from('<admin acc private key pkcs8 hex string>', 'hex')));
        // await publisherAcc.setPrivateKey(adminPrivKey);
        await acc1.generate();
        await acc2.generate();
    }, 30000);

    it('test smart contract publish', async () => {
        client.network = nodeNet;

        const args = {
            name: 'test',
            version: '1.0.1',
            description: 'Just a test smart contract',
            url: 'https://www.example.net/',
            bin: testBin,
        };

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = client.serviceAccount;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = client.network;
        tx.data.smartContractMethod = 'contract_registration';
        tx.data.smartContractMethodArgs = args;
        await tx.sign(publisherAcc.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        await client.waitForTicket(ticket, 10, 2000);
        const serviceAccData = await client.accountData(client.serviceAccount, ['*']);
        const serviceAccKeys: string[] = t2lib.Utils.bytesToObject(serviceAccData.requestedData[0]);
        expect(serviceAccKeys.indexOf(`contracts:code:${testMultiHashHex}`)).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('test unitary transaction - success', async () => {
        client.network = nodeNet;

        const argsBytes = new Uint8Array([0xff, 0x00, 0xff]);

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = acc1.accountId;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = client.network;
        tx.data.smartContractHashHex = testMultiHashHex;
        tx.data.smartContractMethod = 'test_true';
        tx.data.smartContractMethodArgsBytes = argsBytes;
        await tx.sign(acc1.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        const rec = await client.waitForTicket(ticket, 10, 2000);
        expect(rec.success).toBeTruthy();
        expect(rec.result).toEqual(argsBytes);
        const accData = await client.accountData(acc1);
        expect(accData.contractHash).toEqual(testMultiHashHex);
    }, 30000);

    it('test unitary transaction - faillure', async () => {
        client.network = nodeNet;

        const argsBytes = new Uint8Array([0xff, 0x00, 0xff]);

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = acc1.accountId;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = client.network;
        tx.data.smartContractHashHex = testMultiHashHex;
        tx.data.smartContractMethod = 'test_false';
        tx.data.smartContractMethodArgsBytes = argsBytes;
        await tx.sign(acc1.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        const rec = await client.waitForTicket(ticket, 10, 2000);
        expect(rec.success).toBeFalsy();
        expect(rec.result).not.toEqual(argsBytes);
        const accData = await client.accountData(acc1);
        expect(accData.contractHash).toEqual(testMultiHashHex);
    }, 30000);

    it('test unitary transaction - events', async () => {
        client.network = nodeNet;

        const argsBytes = new Uint8Array([0xff, 0x00, 0xff]);

        const tx = new t2lib.UnitaryTransaction();
        tx.data.accountId = acc1.accountId;
        tx.data.maxFuel = 0;
        tx.data.genNonce();
        tx.data.networkName = client.network;
        tx.data.smartContractHashHex = testMultiHashHex;
        tx.data.smartContractMethod = 'test_event';
        tx.data.smartContractMethodArgsBytes = argsBytes;
        await tx.sign(acc1.keyPair.privateKey);

        const testTicket = await tx.getTicket();
        const ticket = await client.submitTx(tx);
        expect(testTicket).toEqual(ticket);
        const rec = await client.waitForTicket(ticket, 10, 2000);
        expect(rec.success).toBeTruthy();
        expect(rec.result).toEqual(argsBytes);
        expect(rec.events.length).toEqual(1);
        expect(rec.events[0].eventTx).toEqual(ticket);
        expect(rec.events[0].emitterAccount).toEqual(acc1.accountId);
        expect(rec.events[0].emitterSmartContract).toEqual(testMultiHashHex);
        expect(rec.events[0].eventName).toEqual('testEvent');
        expect(rec.events[0].eventData).toEqual(argsBytes);
        const accData = await client.accountData(acc1);
        expect(accData.contractHash).toEqual(testMultiHashHex);
    }, 30000);

    it('test bulk transaction', async () => {
        client.network = nodeNet;

        const argsBytes = new Uint8Array([0xff, 0x00, 0xff]);

        const rootTx = new t2lib.BulkRootTransaction();
        rootTx.data.accountId = acc2.accountId;
        rootTx.data.maxFuel = 0;
        rootTx.data.genNonce();
        rootTx.data.networkName = client.network;
        rootTx.data.smartContractHashHex = testMultiHashHex;
        rootTx.data.smartContractMethod = 'test_event';
        rootTx.data.smartContractMethodArgsBytes = argsBytes;
        rootTx.data.signerPublicKey = acc2.keyPair.publicKey;
        const rootTxTicket = await rootTx.getTicket();

        const nodeTx0 = new t2lib.BulkNodeTransaction();
        nodeTx0.data.accountId = acc2.accountId;
        nodeTx0.data.maxFuel = 0;
        nodeTx0.data.genNonce();
        nodeTx0.data.networkName = client.network;
        nodeTx0.data.smartContractHashHex = testMultiHashHex;
        nodeTx0.data.smartContractMethod = 'test_event';
        nodeTx0.data.smartContractMethodArgsBytes = argsBytes;
        nodeTx0.data.dependsOnHex = rootTxTicket;
        await nodeTx0.sign(acc2.keyPair.privateKey);

        const nodeTx1 = new t2lib.BulkNodeTransaction();
        nodeTx1.data.accountId = acc2.accountId;
        nodeTx1.data.maxFuel = 0;
        nodeTx1.data.genNonce();
        nodeTx1.data.networkName = client.network;
        nodeTx1.data.smartContractHashHex = testMultiHashHex;
        nodeTx1.data.smartContractMethod = 'test_false';
        nodeTx1.data.smartContractMethodArgsBytes = argsBytes;
        nodeTx1.data.dependsOnHex = rootTxTicket;
        await nodeTx1.sign(acc2.keyPair.privateKey);

        const bulkTx = new t2lib.BulkTransaction();
        bulkTx.data.root = rootTx;
        bulkTx.data.nodes.push(nodeTx0);
        bulkTx.data.nodes.push(nodeTx1);
        await bulkTx.sign(acc2.keyPair.privateKey);
        await expect(bulkTx.verify()).resolves.toBeTruthy();

        const ticket = await client.submitTx(bulkTx);
        await expect(bulkTx.getTicket()).resolves.toEqual(ticket);
        const rec = await client.waitForBulkTicket(ticket, 10, 2000);
        expect(rec.success).toBeFalsy();
        expect(rec.results[await rootTx.getTicket()].success).toBeTruthy();
        expect(rec.results[await nodeTx0.getTicket()].success).toBeTruthy();
        expect(rec.results[await nodeTx1.getTicket()].success).toBeFalsy();
        await expect(client.accountData(acc2)).rejects.toBeDefined();
    }, 30000);
});
