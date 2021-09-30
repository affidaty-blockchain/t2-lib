import { stringToArrayBuffer, arrayBufferToString } from '../../src/binConversions';
import { AESPassEncrypt, AESPassDecrypt } from '../../src/cryptography/AES';

describe('Testing AES cryptography', () => {
    const testData = 'Hello world!';
    const password = 'secret';
    it('testing password encryption', async () => {
        const encryptedData = await AESPassEncrypt(
            password,
            new Uint8Array(stringToArrayBuffer(testData)),
        );
        const decryptedData = arrayBufferToString(await AESPassDecrypt(password, encryptedData));
        expect(decryptedData).toEqual(testData);
    });
});
