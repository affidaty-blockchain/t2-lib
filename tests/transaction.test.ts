import { Account } from '../src/account';
import * as Tx from '../src/transaction';

describe('Testing transaction class', () => {
    it('test1', async () => {
        const tx0 = new Tx.Transaction();
        const b58 = '2uBeipg36Qrgwo2kKqyg5ENM6SnTsC7Nvy1sDGCMHPfkQLNtVgp9TYhY4vx8xAgCU28bD6sABkEu4RNsu5jU26gYzd9GJ1kRJaRUyWidiGVEnsu5gd1tPa443RnyU88wswSJqi4u2pcp1p1HRFHwDhaTqFJsGrj3nvWdW5dNNTScTTVWyfghGqNC2918CrzZXLPR25jWTAud9XsvxJA61kAVPtkLpK8fYUgFuXUAgDP27DZhge7cB3n6hCG9hLmk8MDJcuxtyVcQqbGJ2VCWaHxspkzSkaNtKeUnhPMrEZvG3LAoY4QAcbQdYEcGPLpMzXe';
        await expect(tx0.fromBase58(b58)).resolves.toBeTruthy();
        const tx1 = new Tx.Transaction();
        tx1.smartContractMethodArgs = new Uint8Array(Buffer.from('81a66e756d62657203', 'hex'));
        const acc = new Account();
        await acc.generate();
        await tx1.sign(acc.keyPair.privateKey);
        await expect(tx1.verify()).resolves.toBeTruthy();
        const testPubKey = await tx1.signerPublicKey.getRaw();
        const origPubKey = await acc.keyPair.publicKey.getRaw();
        expect(testPubKey).toEqual(origPubKey);
        tx1.signerPublicKey = acc.keyPair.publicKey;
        await expect(tx1.verify()).resolves.toBeTruthy();

        const txBytes = await tx1.toBytes();
        const txObj1 = await tx1.toObject();
        const txObj2 = await tx1.toUnnamedObject();

        const txFromObj2 = new Tx.Transaction();
        await txFromObj2.fromUnnamedObject(txObj2);
        await expect(txFromObj2.verify()).resolves.toBeTruthy();
        txFromObj2.accountId = acc.accountId;
        await expect(txFromObj2.verify()).resolves.toBeFalsy();

        tx1.accountId = acc.accountId;
        await expect(tx1.verify()).resolves.toBeFalsy();
        const tx2 = new Tx.Transaction();
        await tx2.fromBytes(txBytes);
        const tx3 = new Tx.Transaction();
        await tx3.fromObject(txObj1);
        const key1 = await tx1.signerPublicKey.getJWK();
        const key2 = await tx2.signerPublicKey.getJWK();
        const key3 = await tx3.signerPublicKey.getJWK();
        expect(key1).toEqual(key2);
        expect(key1).toEqual(key3);
        expect(key2).toEqual(key3);

        const txObj3: Tx.ITxObject = {
            data: {
                // schema: '',
                account: '',
                nonce: new Uint8Array(0),
                network: '',
                contract: new Uint8Array(0),
                method: '',
                caller: {
                    type: '',
                    curve: '',
                    value: new Uint8Array(0),
                },
                args: new Uint8Array(0),
            },
            signature: new Uint8Array(0),
        };
        const txFromObj3 = new Tx.Transaction();
        await txFromObj3.fromObject(txObj3);
        const testTxObj3 = await txFromObj3.toObject();
        expect(testTxObj3).toEqual(txObj3);
    });
});
