import {
    UnitaryTransaction,
    BulkRootTransaction,
    BulkNodeTransaction,
    BulkTransaction,
    Transaction,
    Account,
    ECDHKeyPair,
    Errors,
    Utils,
} from '../index';

describe('transaction', () => {
    const ecdh = new ECDHKeyPair();
    const acc = new Account();
    const t = new UnitaryTransaction();

    it('init', async () => {
        await expect(acc.generate()).resolves.toBeTruthy();
        await expect(ecdh.generate()).resolves.toBeTruthy();
    });

    it('accessors', async () => {
        const schema = 'test_schema';
        const tempSchema = t.data.schema;
        t.data.schema = schema;
        expect(t.data.schema).toEqual(schema);
        t.data.schema = tempSchema;
        const fuel = 26;
        t.data.maxFuel = fuel;
        expect(t.data.maxFuel).toEqual(fuel);
        t.data.accountId = acc.accountId;
        expect(t.data.accountId).toEqual(acc.accountId);
        const net = 'test_network';
        t.data.networkName = net;
        expect(t.data.networkName).toEqual(net);
        const method = 'my_sc_method';
        t.data.smartContractMethod = method;
        expect(t.data.smartContractMethod).toEqual(method);
        t.data.signerPublicKey = acc.keyPair.publicKey;
        expect(t.data.signerPublicKey).toEqual(acc.keyPair.publicKey);

        const bytes1 = new Uint8Array([0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7]);
        const bytesHex1 = Buffer.from(bytes1).toString('hex');

        const bytes2 = new Uint8Array([0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0xf0]);
        const bytesHex2 = Buffer.from(bytes2).toString('hex');

        let error = new Error();
        try {
            t.data.nonce = new Uint8Array([0xff, 0xfa]);
        } catch (tError) {
            error = tError;
        }
        expect(error).toEqual(new Error(Errors.WRONG_TX_NONCE_LENGTH));
        t.data.nonce = bytes1;
        expect(t.data.nonceHex).toEqual(bytesHex1);
        error = new Error();
        try {
            t.data.nonce = new Uint8Array([0xff, 0xfa]);
        } catch (tError) {
            error = tError as Error;
        }
        expect(error).toEqual(new Error(Errors.WRONG_TX_NONCE_LENGTH));
        t.data.nonceHex = bytesHex2;
        expect(t.data.nonce).toEqual(bytes2);

        t.data.smartContractHash = bytes1;
        expect(t.data.smartContractHashHex).toEqual(bytesHex1);
        t.data.smartContractHashHex = bytesHex2;
        expect(t.data.smartContractHash).toEqual(bytes2);

        const args = {
            a: 'string', b: 42, c: true, d: null, e: ['a', true, 0, false],
        };
        const argsBytes = Utils.objectToBytes(args);
        const argsHex = Buffer.from(argsBytes).toString('hex');

        t.data.smartContractMethodArgs = args;
        expect(t.data.smartContractMethodArgs).toEqual(args);
        expect(t.data.smartContractMethodArgsBytes).toEqual(argsBytes);
        expect(t.data.smartContractMethodArgsHex).toEqual(argsHex);

        t.data.smartContractMethodArgs = {};
        t.data.smartContractMethodArgsBytes = argsBytes;
        expect(t.data.smartContractMethodArgs).toEqual(args);
        expect(t.data.smartContractMethodArgsBytes).toEqual(argsBytes);
        expect(t.data.smartContractMethodArgsHex).toEqual(argsHex);

        t.data.smartContractMethodArgs = {};
        t.data.smartContractMethodArgsHex = argsHex;
        expect(t.data.smartContractMethodArgs).toEqual(args);
        expect(t.data.smartContractMethodArgsBytes).toEqual(argsBytes);
        expect(t.data.smartContractMethodArgsHex).toEqual(argsHex);
    });

    it('methods', async () => {
        const t2 = new UnitaryTransaction();
        t2.genNonce();
        expect(t2.data.nonce).toHaveLength(8);
        const bytes = new Uint8Array([0xf0, 0xf1]);
        const bytesHex = Buffer.from(bytes).toString('hex');
        t2.data.setSmartContractHash(bytes);
        expect(t2.data.smartContractHashHex).toEqual(bytesHex);
        const bytes2 = new Uint8Array([0xf2, 0xf3]);
        const bytesHex2 = Buffer.from(bytes2).toString('hex');
        t2.data.setSmartContractHash(bytesHex2);
        expect(t2.data.smartContractHash).toEqual(bytes2);
    });

    it('sign', async () => {
        await expect(t.sign(ecdh.privateKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(t.sign(acc.keyPair.publicKey)).rejects.toThrow(Errors.ONLY_FOR_PRIVKEY);
        await expect(t.sign(acc.keyPair.privateKey)).resolves.toBeTruthy();
        await expect(t.verifySignature(t.data.signerPublicKey)).resolves.toBeTruthy();
    });

    it('verify', async () => {
        const acc2 = new Account();
        await expect(acc2.generate()).resolves.toBeTruthy();
        const t2 = new UnitaryTransaction();
        await expect(t2.verify()).rejects.toThrow(Errors.NO_BASE_KEY_VALUE);
        await expect(t2.sign(acc2.keyPair.privateKey)).resolves.toBeTruthy();
        t2.data.signerPublicKey = acc.keyPair.publicKey;
        await expect(t2.verify()).resolves.toBeFalsy();
        await expect(t.verify()).resolves.toBeTruthy();
    });

    it('to/from object', async () => {
        const tObj = await t.toObject();
        const t2 = new UnitaryTransaction();
        await expect(t2.fromObject(tObj)).resolves.toBeTruthy();
        const t2Obj = await t2.toObject();
        const t3 = new UnitaryTransaction();
        await expect(t3.fromObject(t2Obj)).resolves.toBeTruthy();
        expect(t2).toEqual(t3);
        await expect(t2.verify()).resolves.toBeTruthy();
        await expect(t3.verify()).resolves.toBeTruthy();
    });

    it('to/from bytes', async () => {
        const tBytes = await t.toBytes();
        const t2 = new UnitaryTransaction();
        await expect(t2.fromBytes(tBytes)).resolves.toBeTruthy();
        const t2Bytes = await t2.toBytes();
        const t3 = new UnitaryTransaction();
        await expect(t3.fromBytes(t2Bytes)).resolves.toBeTruthy();
        expect(t2).toEqual(t3);
        await expect(t2.verify()).resolves.toBeTruthy();
        await expect(t3.verify()).resolves.toBeTruthy();
    });

    it('to/from base58', async () => {
        const tBase58 = await t.toBase58();
        const t2 = new UnitaryTransaction();
        await expect(t2.fromBase58(tBase58)).resolves.toBeTruthy();
        const t2Base58 = await t2.toBase58();
        const t3 = new UnitaryTransaction();
        await expect(t3.fromBase58(t2Base58)).resolves.toBeTruthy();
        expect(t2).toEqual(t3);
        await expect(t2.verify()).resolves.toBeTruthy();
        await expect(t3.verify()).resolves.toBeTruthy();
    });

    it('UnitaryTransaction', async () => {
        const tx1 = new UnitaryTransaction();
        await tx1.sign(acc.keyPair.privateKey);
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        const tx1Ticket = await tx1.getTicket();

        const tx2 = new UnitaryTransaction();
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

        const tx3 = new Transaction();
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

    it('bulkRootTransaction', async () => {
        const tx1 = new BulkRootTransaction();
        await expect(
            tx1.sign(
                acc.keyPair.privateKey,
            ),
        ).rejects.toEqual(new Error(Errors.BULK_ROOT_TX_NO_SIGN));
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        const tx1Ticket = await tx1.getTicket();

        const tx2 = new BulkRootTransaction();
        await tx2.fromBase58(tx1B58);
        let tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).rejects.toEqual(new Error(Errors.BULK_ROOT_TX_NO_VERIFY));
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await tx2.fromObject(tx1Obj);
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        tx2.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);

        const tx3 = new Transaction();
        await tx3.fromBase58(tx1B58);
        let tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
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
        const tx1 = new BulkNodeTransaction();
        tx1.data.dependsOnHex = 'aabbccddeeff';
        await tx1.sign(acc.keyPair.privateKey);
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        const tx1Ticket = await tx1.getTicket();

        const tx2 = new BulkNodeTransaction();
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

        const tx3 = new Transaction();
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

    it('bulkTransaction', async () => {
        const root = new BulkRootTransaction();
        root.data.accountId = 'root';
        root.data.signerPublicKey = acc.keyPair.publicKey;
        const node0 = new BulkNodeTransaction();
        node0.data.accountId = 'node0';
        node0.data.dependsOnHex = await root.getTicket();
        await node0.sign(acc.keyPair.privateKey);
        const node1 = new BulkNodeTransaction();
        node1.data.accountId = 'node1';
        node1.data.dependsOnHex = await root.getTicket();
        await node1.sign(acc.keyPair.privateKey);

        const tx1 = new BulkTransaction();
        tx1.data.root = root;
        tx1.data.nodes.push(node0);
        tx1.data.nodes.push(node1);
        await tx1.sign(acc.keyPair.privateKey);
        await expect(tx1.verify()).resolves.toBeTruthy();
        const tx1B58 = await tx1.toBase58();
        const tx1Obj = await tx1.toObject();
        const tx1Ticket = await tx1.getTicket();

        const tx2 = new BulkTransaction();
        await tx2.fromBase58(tx1B58);
        let tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeTruthy();
        tx2.data.root.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await expect(tx2.verify()).rejects.toBeDefined();
        await tx2.fromObject(tx1Obj);
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).toEqual(tx1Ticket);
        await expect(tx2.verify()).resolves.toBeTruthy();
        tx2.data.root.data.networkName = 'testVal';
        tx2Ticket = await tx2.getTicket();
        expect(tx2Ticket).not.toEqual(tx1Ticket);
        await expect(tx2.verify()).rejects.toBeDefined();

        const tx3 = new Transaction();
        await tx3.fromBase58(tx1B58);
        let tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeTruthy();
        (tx3 as BulkTransaction).data.root.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeFalsy();
        await tx3.fromObject(tx1Obj);
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeTruthy();
        (tx3 as BulkTransaction).data.root.data.networkName = 'testVal';
        tx3Ticket = await tx3.getTicket();
        expect(tx3Ticket).not.toEqual(tx1Ticket);
        await expect(tx3.verify()).resolves.toBeFalsy();
    }, 30000);
});
