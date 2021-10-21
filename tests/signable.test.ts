import { Signable, ECDSAKeyPair, ECDHKeyPair } from '../index';

describe('signable', () => {
    const ecdsa = new ECDSAKeyPair();
    const ecdh = new ECDHKeyPair();
    const s = new Signable();
    const testData = {
        a: 42,
        b: 'string',
        c: [
            'a',
            true,
            3.14,
        ],
    };

    it('init', async () => {
        await expect(ecdsa.generate()).resolves.toBeTruthy();
        await expect(ecdh.generate()).resolves.toBeTruthy();
    });

    it('accessors', async () => {
        s.data = testData;
        expect(s.data).toEqual(testData);
        const bytes = new Uint8Array([0xff, 0xfa]);
        s.signature = bytes;
        expect(s.signature).toEqual(bytes);
    });

    it('sign', async () => {
        await expect(s.sign(ecdh.privateKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(s.sign(ecdsa.publicKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(s.sign(ecdsa.privateKey)).resolves.toBeTruthy();
    });

    it('verifySignature', async () => {
        const ecdsa2 = new ECDSAKeyPair();
        await ecdsa2.generate();
        await expect(s.verifySignature(ecdh.publicKey)).rejects.toThrow('Unable to use this key to verify');
        await expect(s.verifySignature(ecdsa.privateKey)).rejects.toThrow('Unable to use this key to verify');
        await expect(s.verifySignature(ecdsa2.publicKey)).resolves.toBeFalsy();
        await expect(s.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    it('to/from object', async () => {
        const sObj = await s.toObject();
        const s2 = new Signable();
        await expect(s2.fromObject(sObj)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    it('to/from bytes', async () => {
        const bytes = await s.toBytes();
        const s2 = new Signable();
        await expect(s2.fromBytes(bytes)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });

    it('to/from base58', async () => {
        const b58 = await s.toBase58();
        const s2 = new Signable();
        await expect(s2.fromBase58(b58)).resolves.toBeTruthy();
        expect(s2).toEqual(s);
        await expect(s2.verifySignature(ecdsa.publicKey)).resolves.toBeTruthy();
    });
});
