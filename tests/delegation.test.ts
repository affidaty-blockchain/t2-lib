import {
    Delegation, ECDSAKeyPair, ECDHKeyPair, Errors,
} from '../index';

describe('delegation', () => {
    const ecdsa = new ECDSAKeyPair();
    const ecdh = new ECDHKeyPair();
    const d = new Delegation();


    it('init', async () => {
        await expect(ecdsa.generate()).resolves.toBeTruthy();
        await expect(ecdh.generate()).resolves.toBeTruthy();
    });

    it('capabilities', async () => {
        d.capabilities = {
            my_method: true,
        };
        expect(d.hasCapability('my_method')).toBeTruthy();
        expect(d.hasCapability('other_method')).toBeFalsy();
        d.capabilities = {
            '*': false,
            publicMethod: true,
        };
        expect(d.hasCapability('my_method')).toBeFalsy();
        expect(d.hasCapability('publicMethod')).toBeTruthy();
        d.capabilities = {
            '*': true,
            secretMethod: false,
        };
        expect(d.hasCapability('my_method')).toBeTruthy();
        expect(d.hasCapability('secretMethod')).toBeFalsy();
    });

    it('sign', async () => {
        await expect(d.sign(ecdh.privateKey)).rejects.toThrow('Unable to use this key to sign');
        await expect(d.sign(ecdsa.publicKey)).rejects.toThrow(Errors.ONLY_FOR_PRIVKEY);
        await expect(d.sign(ecdsa.privateKey)).resolves.toBeTruthy();
        await expect(d.verifySignature(d.delegator)).resolves.toBeTruthy();
    });

    it('verify', async () => {
        let expTemp = d.expiration;
        d.expiration = 0;
        await expect(d.verify((Math.trunc(new Date().getTime() / 1000) + 1000000000))).resolves.toBeFalsy();
        d.expiration = expTemp;
        await expect(d.verify()).resolves.toBeTruthy();
    });

    it('to/from object', async () => {
        const dObj = await d.toObject();
        const d2 = new Delegation();
        await expect(d2.fromObject(dObj)).resolves.toBeTruthy();
        const d2Obj = await d2.toObject();
        const d3 = new Delegation();
        await expect(d3.fromObject(d2Obj)).resolves.toBeTruthy();
        expect(d2).toEqual(d3);
        await expect(d2.verify()).resolves.toBeTruthy();
        await expect(d3.verify()).resolves.toBeTruthy();
    });

    it('to/from bytes', async () => {
        const dBytes = await d.toBytes();
        const d2 = new Delegation();
        await expect(d2.fromBytes(dBytes)).resolves.toBeTruthy();
        const d2Bytes = await d2.toBytes();
        const d3 = new Delegation();
        await expect(d3.fromBytes(d2Bytes)).resolves.toBeTruthy();
        expect(d2).toEqual(d3);
        await expect(d2.verify()).resolves.toBeTruthy();
        await expect(d3.verify()).resolves.toBeTruthy();
    });

    it('to/from base58', async () => {
        const dBase58 = await d.toBase58();
        const d2 = new Delegation();
        await expect(d2.fromBase58(dBase58)).resolves.toBeTruthy();
        const d2Base58 = await d2.toBase58();
        const d3 = new Delegation();
        await expect(d3.fromBase58(d2Base58)).resolves.toBeTruthy();
        expect(d2).toEqual(d3);
        await expect(d2.verify()).resolves.toBeTruthy();
        await expect(d3.verify()).resolves.toBeTruthy();
    });
});
