import { toBigIntBE, toBufferBE } from 'bigint-buffer';
import * as Defaults from '../src/cryptography/cryptoDefaults';
import { Subtle } from '../src/cryptography/webCrypto';
import { RSAKey } from '../src/cryptography/RSAKey';
import {
    getFactor,
    applyBlinding,
    removeBlinding,
    addSalt,
    blindSign,
    encrypt,
    decrypt,
} from '../src/cryptography/RSABlindSignature';

// !!!!!!!IMPORTANT: message max safe size in bytes = keySizeBytes - 1
// !!!!!!!IMPORTANT: salt max safe size in bytes = keySizeBytes - messageSizeBytes -1

describe('testing blind signature', () => {
    let rsaKeyPair: any;
    let pubkeySPKI: Uint8Array;
    let privkeyPKCS8: Uint8Array;

    const message = new Uint8Array(Buffer.from('122022264e20bc0cf4b49a7e7c9b4a0e427605a2e04a05255ee50cec3666d0cbbc1b', 'hex'));
    // salt that server will apply to blinded message from client before signing it.
    const salt = new Uint8Array(Buffer.from('e52858b19cfe12e4742b55e1ad239e849818fb1c8ff1b47c64dbad50c361e9d2183750a8ca713fe806df5b40f30bca4128d1147412715462df570e144ea3a9ccfd999a677e313d19f1d560bbe9d96baba4fd8e0f92ba587d63c17bb5d9', 'hex'));

    it('init', async () => {
        rsaKeyPair = await Subtle.generateKey(
            Defaults.RSAOAEP384PrivKeyParams.genAlgorithm,
            true,
            Defaults.RSAOAEP384KeyPairParams.usages,
        );
        pubkeySPKI = new Uint8Array(await Subtle.exportKey('spki', rsaKeyPair.publicKey));
        privkeyPKCS8 = new Uint8Array(await Subtle.exportKey('pkcs8', rsaKeyPair.privateKey));
    });
    it('Testing RSA classes', async () => {
        // authority keys
        const pubKey = new RSAKey('public');
        await pubKey.setSPKI(pubkeySPKI);
        const privKey = new RSAKey('private');
        await privKey.setPKCS8(privkeyPKCS8);

        // authority sends public key to client
        // client finds a blinding factor using received public key
        // (save it till the end of the process)
        const blindingFactor = await getFactor(pubKey);
        // client applies the blinding factor to the message and sends
        // the blinded message
        const blindedData = await applyBlinding(
            message,
            blindingFactor,
            pubKey,
        );

        // authority applies a salt to received data
        const blindedSaltedData = await addSalt(blindedData, salt, pubKey);
        // Signs it with it's private key and sends it back to client
        const blindedSaltedSignature = await blindSign(blindedSaltedData, privKey);

        // clients can now remove the blinding from the received signature
        // and use it to send the anonimous vote
        const unblindedSaltedSignature = await removeBlinding(
            blindedSaltedSignature,
            blindingFactor,
            pubKey,
        );

        // algorithm correctness check
        const decryptedUnblindedSaltedSignature = await decrypt(
            unblindedSaltedSignature,
            pubKey,
            (message.byteLength + salt.byteLength),
        );
        const plainSaltedMessage = new Uint8Array(toBufferBE(
            (toBigIntBE(Buffer.from(message)) * toBigIntBE(Buffer.from(salt))),
            (message.byteLength + salt.byteLength),
        ));
        expect(decryptedUnblindedSaltedSignature).toEqual(plainSaltedMessage);
        const plainSaltedSignature = await encrypt(
            plainSaltedMessage,
            privKey, (privKey.keyParams.genAlgorithm!.modulusLength! / 8),
        );
        expect(unblindedSaltedSignature).toEqual(plainSaltedSignature);
    });
});
