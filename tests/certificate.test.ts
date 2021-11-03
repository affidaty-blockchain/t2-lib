import {
    Certificate, ECDSAKeyPair, ECDHKeyPair, Errors,
} from '../index';

describe('certificate', () => {
    const ecdsa = new ECDSAKeyPair();
    const ecdh = new ECDHKeyPair();
    const c = new Certificate();
    const t = 'target';
    const testData = {
        name: 'John',
        surname: 'Doe',
        sex: 'male',
        tel: '1634829548',
        email: 'john.doe@mail.net',
    };

    it('init', async () => {
        await expect(ecdsa.generate()).resolves.toBeTruthy();
        await expect(ecdh.generate()).resolves.toBeTruthy();
    });

    it('accessors', async () => {
        const fields = ['name', 'surname', 'sex'];
        const bytes = new Uint8Array([0xff, 0xfa]);
        const ecdsa2 = new ECDSAKeyPair();
        const c2 = new Certificate();
        c2.target = t;
        expect(c2.target).toEqual(t);
        c2.fields = fields;
        expect(c2.fields).toEqual(fields);
        c2.salt = bytes;
        expect(c2.salt).toEqual(bytes);
        c2.root = bytes;
        expect(c2.root).toEqual(bytes);
        c2.certifier = ecdsa2.publicKey;
        expect(c2.certifier).toEqual(ecdsa2.publicKey);
        c2.signature = bytes;
        expect(c2.signature).toEqual(bytes);
        c2.multiProof = [bytes, bytes];
        expect(c2.multiProof).toEqual([bytes, bytes]);
        c2.dataToCertify = testData;
        expect(c2.dataToCertify).toEqual(testData);
    });

    it('create', async () => {
        c.dataToCertify = testData;
        c.target = t;
        c.create();
        expect(c.salt.byteLength).toBeGreaterThan(0);
        expect(c.root.byteLength).toBeGreaterThan(0);
        expect(c.fields).toEqual(Object.keys(testData).sort());
        expect(c.multiProof.length).toEqual(0);
        c.create(['name', 'sex']);
        expect(c.multiProof.length).toEqual(3);
    });

    it('sign', async () => {
        await expect(c.sign(ecdh.privateKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(c.sign(ecdsa.publicKey)).rejects.toThrow(Errors.ONLY_FOR_PRIVKEY);
        await expect(c.sign(ecdsa.privateKey)).resolves.toBeTruthy();
        await expect(c.verifySignature(c.certifier)).resolves.toBeTruthy();
    });

    it('verify', async () => {
        c.create(['name', 'surname']);
        await expect(c.verify()).resolves.toBeFalsy();
        await expect(c.verify({ name: 'John', surname: 'Doe', sex: 'male' })).resolves.toBeFalsy();
        await expect(c.verify({ name: 'John', surname: 'Dove' })).resolves.toBeFalsy();
        await expect(c.verify({ name: 'John', surname: 'Doe' })).resolves.toBeTruthy();
        c.create();
        await expect(c.verify({ name: 'John', surname: 'Doe' })).resolves.toBeFalsy();
        c.target = 'accIdString';
        await expect(c.verify(testData)).resolves.toBeFalsy();
        c.target = t;
        await expect(c.verify(testData)).resolves.toBeTruthy();
    });

    it('to/from object', async () => {
        const cObj = await c.toObject();
        const c2 = new Certificate();
        await expect(c2.fromObject(cObj)).resolves.toBeTruthy();
        const c2Obj = await c2.toObject();
        const c3 = new Certificate();
        await expect(c3.fromObject(c2Obj)).resolves.toBeTruthy();
        expect(c2).toEqual(c3);
        await expect(c2.verify(testData)).resolves.toBeTruthy();
        await expect(c3.verify(testData)).resolves.toBeTruthy();
    });

    it('to/from bytes', async () => {
        const cBytes = await c.toBytes();
        const c2 = new Certificate();
        await expect(c2.fromBytes(cBytes)).resolves.toBeTruthy();
        const c2Bytes = await c2.toBytes();
        const c3 = new Certificate();
        await expect(c3.fromBytes(c2Bytes)).resolves.toBeTruthy();
        expect(c2).toEqual(c3);
        await expect(c2.verify(testData)).resolves.toBeTruthy();
        await expect(c3.verify(testData)).resolves.toBeTruthy();
    });

    it('to/from base58', async () => {
        const cBase58 = await c.toBase58();
        const c2 = new Certificate();
        await expect(c2.fromBase58(cBase58)).resolves.toBeTruthy();
        const c2Base58 = await c2.toBase58();
        const c3 = new Certificate();
        await expect(c3.fromBase58(c2Base58)).resolves.toBeTruthy();
        expect(c2).toEqual(c3);
        await expect(c2.verify(testData)).resolves.toBeTruthy();
        await expect(c3.verify(testData)).resolves.toBeTruthy();
    });
});
