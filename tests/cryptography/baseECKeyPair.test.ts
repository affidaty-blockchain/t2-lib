import * as BaseTypes from '../../src/cryptography/baseTypes';
import * as Base from '../../src/cryptography/base';
import * as Defaults from '../../src/cryptography/cryptoDefaults';
import { BaseECKeyPair } from '../../src/cryptography/baseECKeyPair';
import { Subtle } from '../../src/cryptography/webCrypto';

describe('Testing elliptic curve cryptography implementations', () => {
    describe('Testing base EC key with ECDSA default parameters', () => {
        let ecdsaKeyPair: CryptoKeyPair;
        let ecdsaPublicKeyJwk: BaseTypes.IJwk;
        let ecdsaPublicKeyRaw: ArrayBuffer;
        let ecdsaPublicKeySPKI: ArrayBuffer;
        let ecdsaPrivateKeyJwk: BaseTypes.IJwk;
        let ecdsaPrivateKeyPKCS8: ArrayBuffer;

        let ecdhKeyPair: CryptoKeyPair;
        let ecdhPublicKeyJwk: BaseTypes.IJwk;
        let ecdhPublicKeyRaw: ArrayBuffer;
        let ecdhPublicKeySPKI: ArrayBuffer;
        let ecdhPrivateKeyJwk: BaseTypes.IJwk;
        let ecdhPrivateKeyPKCS8: ArrayBuffer;

        let rsaKeyPair: CryptoKeyPair;
        let rsaPrivateKeyJwk: BaseTypes.IJwk;
        let rsaPrivateKeyPKCS8: ArrayBuffer;

        it('setting control values', async () => {
            ecdsaKeyPair = await Subtle.generateKey(
                Defaults.ECDSAP384R1PrivKeyParams.genAlgorithm,
                true,
                Defaults.ECDSAP384R1KeyPairParams.usages,
            );
            expect(ecdsaKeyPair).toBeDefined();
            expect(ecdsaKeyPair.publicKey).toBeDefined();
            expect(ecdsaKeyPair.privateKey).toBeDefined();
            ecdsaPublicKeyJwk = await Subtle.exportKey('jwk', ecdsaKeyPair.publicKey);
            expect(ecdsaPublicKeyJwk).toBeDefined();
            ecdsaPublicKeyRaw = await Subtle.exportKey('raw', ecdsaKeyPair.publicKey);
            expect(ecdsaPublicKeyRaw).toBeDefined();
            ecdsaPublicKeySPKI = await Subtle.exportKey('spki', ecdsaKeyPair.publicKey);
            expect(ecdsaPublicKeySPKI).toBeDefined();
            ecdsaPrivateKeyJwk = await Subtle.exportKey('jwk', ecdsaKeyPair.privateKey);
            expect(ecdsaPrivateKeyJwk).toBeDefined();
            ecdsaPrivateKeyPKCS8 = await Base.keyJWKToBin(ecdsaPrivateKeyJwk, 'der');
            expect(ecdsaPrivateKeyPKCS8).toBeDefined();

            ecdhKeyPair = await Subtle.generateKey(
                Defaults.ECDHP384R1PrivKeyParams.genAlgorithm,
                true,
                Defaults.ECDHP384R1KeyPairParams.usages,
            );
            expect(ecdhKeyPair).toBeDefined();
            expect(ecdhKeyPair.publicKey).toBeDefined();
            expect(ecdhKeyPair.privateKey).toBeDefined();
            ecdhPublicKeyJwk = await Subtle.exportKey('jwk', ecdsaKeyPair.publicKey);
            expect(ecdhPublicKeyJwk).toBeDefined();
            ecdhPublicKeyRaw = await Subtle.exportKey('raw', ecdsaKeyPair.publicKey);
            expect(ecdhPublicKeyRaw).toBeDefined();
            ecdhPublicKeySPKI = await Subtle.exportKey('spki', ecdsaKeyPair.publicKey);
            expect(ecdhPublicKeySPKI).toBeDefined();
            ecdhPrivateKeyJwk = await Subtle.exportKey('jwk', ecdsaKeyPair.privateKey);
            expect(ecdhPrivateKeyJwk).toBeDefined();
            ecdhPrivateKeyPKCS8 = await Subtle.exportKey('pkcs8', ecdsaKeyPair.privateKey);
            expect(ecdhPrivateKeyPKCS8).toBeDefined();

            rsaKeyPair = await Subtle.generateKey(
                Defaults.RSAOAEP384KeyPairParams.privateKey.genAlgorithm,
                true,
                Defaults.RSAOAEP384KeyPairParams.usages,
            );
            expect(rsaKeyPair).toBeDefined();
            rsaPrivateKeyJwk = await Subtle.exportKey('jwk', rsaKeyPair.privateKey);
            expect(rsaPrivateKeyJwk).toBeDefined();
            rsaPrivateKeyPKCS8 = await Subtle.exportKey('pkcs8', rsaKeyPair.privateKey);
            expect(rsaPrivateKeyPKCS8).toBeDefined();
        });
        it('testing initialization', async () => {
            const baseECKeyPair = new BaseECKeyPair(Defaults.ECDSAP384R1KeyPairParams);
            expect(baseECKeyPair.privateKey.paramsId).toEqual(
                Defaults.mKeyPairParams.get(baseECKeyPair.privateKey.paramsId)!.privateKey.paramsId,
            );
            expect(baseECKeyPair.publicKey.paramsId).toEqual(
                Defaults.mKeyPairParams.get(baseECKeyPair.publicKey.paramsId)!.publicKey.paramsId,
            );
            expect(baseECKeyPair.keyPairParams).toEqual(Defaults.ECDSAP384R1KeyPairParams);
            expect(baseECKeyPair.publicKey.keyParams).toEqual(
                Defaults.ECDSAP384R1PubKeyParams,
            );
            expect(baseECKeyPair.privateKey.keyParams).toEqual(
                Defaults.ECDSAP384R1PrivKeyParams,
            );
            await expect(baseECKeyPair.generate()).resolves.toBeTruthy();
            await expect(baseECKeyPair.publicKey.getRaw())
                .resolves.toBeInstanceOf(Uint8Array);
            await expect(baseECKeyPair.publicKey.getSPKI())
                .resolves.toBeInstanceOf(Uint8Array);
            await expect(baseECKeyPair.privateKey.getPKCS8())
                .resolves.toBeInstanceOf(Uint8Array);
        });
        it('testing class exceptions', async () => {
            const customKeyPairParams: BaseTypes.IKeyPairParams = {
                publicKey: Defaults.ECDSAP384R1KeyPairParams.publicKey,
                privateKey: Defaults.ECDSAP384R1KeyPairParams.privateKey,
                usages: ['decrypt', 'encrypt'],
            };
            let baseECKeyPair = new BaseECKeyPair(customKeyPairParams);
            await expect(baseECKeyPair.generate())
                .rejects.toBeDefined();

            customKeyPairParams.usages = ['sign'];
            baseECKeyPair = new BaseECKeyPair(customKeyPairParams);
            await expect(baseECKeyPair.generate())
                .rejects.toBeDefined();

            customKeyPairParams.usages = ['verify'];
            baseECKeyPair = new BaseECKeyPair(customKeyPairParams);
            await expect(baseECKeyPair.generate())
                .rejects.toBeDefined();
        });
    });
});
