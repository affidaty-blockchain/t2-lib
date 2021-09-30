import * as Errors from '../src/errors';
import { Account } from '../src/account';
import { Certificate } from '../src/certificate';

describe('', () => {
    const acc = new Account();
    let srcData: any = {};

    it('', async () => {
        srcData = {
            name: 'John', // 2
            surname: 'Doe', // 3
            email: 'john.doe@mail.com', // 1
            cf: 'ABCDEF1234567890', // 0
        };
        await acc.generate();
    });
    it('', async () => {
        const c1 = new Certificate();

        // Full set of data to create a certificate for
        c1.dataToCertify = srcData;

        // simple create, no multiproof. Full data needed during verify
        c1.create();
        await c1.sign(acc.keyPair.privateKey);
        // certificate has no multiproof, so full data needed.
        await expect(c1.verify(srcData)).resolves.toBeTruthy();
        // create a derived certificate which can be verified by providing only 'email' field
        // no singing needed, it has been signed already
        c1.create(['email']);
        await expect(c1.verify({email: 'john.doe@mail.com'})).resolves.toBeTruthy();
        await expect(c1.verify({email: 'john.doe1@mail.com'})).resolves.toBeFalsy();
        await expect(c1.verify()).rejects.toEqual(new Error(Errors.CERT_NO_DATA_VERIFY));
        // c1.create(['cf']);
        // await expect(c1.verify()).resolves.toBeTruthy();
        // const c1Bytes = await c1.toBytes();
        // c1.salt = new Uint8Array([0xff, 0xff]);
        // await expect(c1.verify()).resolves.toBeFalsy();
        // const c2 = new Certificate();
        // await c2.fromBytes(c1Bytes);
        // await expect(c2.verify(
        //     {
        //         // name: 'Mario',
        //         // surname: 'Rossi',
        //         // email: 'mario.rossi@hotmail.it',
        //         cf: 'ABCDEF1234567890',
        //     },
        // )).resolves.toBeTruthy();
        // await expect(c2.verify(
        //     {
        //         // name: 'Mario',
        //         // surname: 'Rossi',
        //         // email: 'mario.rossi@hotmail.it',
        //         cf: 'ABCDEF1234567891',
        //     },
        // )).resolves.toBeFalsy();
    }, 30000);
});
