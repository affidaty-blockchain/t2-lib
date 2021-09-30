import * as Sn from '../src/signable';
import { Account } from '../src/account';
import { ECDSAKey } from '../src/cryptography/ECDSAKey';

describe('Testing signable class', () => {
    it('test1', async () => {
        const acc = new Account();
        await acc.generate();
        const sn1 = new Sn.Signable();
        sn1.data = { key: 'val' };
        await sn1.sign(acc.keyPair.privateKey);
        await expect(sn1.verifySignature(acc.keyPair.publicKey)).resolves.toBeTruthy();
        sn1.data = { key1: 'val1' };
        await expect(sn1.verifySignature(acc.keyPair.publicKey)).resolves.toBeFalsy();
        await sn1.sign(acc.keyPair.privateKey);
        await expect(sn1.verifySignature(acc.keyPair.publicKey)).resolves.toBeTruthy();
        const b58 = await sn1.toBase58();
        const sn2 = new Sn.Signable();
        await sn2.fromBase58(b58);
        await expect(sn2.verifySignature(acc.keyPair.publicKey)).resolves.toBeTruthy();
        const testb58 = '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';
        const s3 = new Sn.Signable();
        await s3.fromBase58(testb58);
        const s3Obj = await s3.toObject();
        const pubKey = new ECDSAKey('public');
        await pubKey.setSPKI(s3Obj.data.caller.value);
        await expect(s3.verifySignature(pubKey)).resolves.toBeTruthy();
    });
});
