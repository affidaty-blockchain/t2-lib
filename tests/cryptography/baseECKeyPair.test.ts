import * as BaseTypes from '../../src/cryptography/baseTypes';
import * as Base from '../../src/cryptography/base';
import * as Defaults from '../../src/cryptography/cryptoDefaults';
import { BaseECKeyPair } from '../../src/cryptography/baseECKeyPair';
import { Subtle } from '../../src/cryptography/webCrypto';

describe('Testing elliptic curve cryptography implementations', () => {
    describe('Testing base EC key with ECDSA default parameters', () => {
        /* eslint-disable-next-line no-undef */
        let ecdsaKeyPair: CryptoKeyPair;
        let ecdsaPublicKeyJwk: BaseTypes.IJwk;
        let ecdsaPublicKeyRaw: ArrayBuffer;
        let ecdsaPublicKeySPKI: ArrayBuffer;
        let ecdsaPrivateKeyJwk: BaseTypes.IJwk;
        let ecdsaPrivateKeyPKCS8: ArrayBuffer;

        /* eslint-disable-next-line no-undef */
        let ecdhKeyPair: CryptoKeyPair;
        let ecdhPublicKeyJwk: BaseTypes.IJwk;
        let ecdhPublicKeyRaw: ArrayBuffer;
        let ecdhPublicKeySPKI: ArrayBuffer;
        let ecdhPrivateKeyJwk: BaseTypes.IJwk;
        let ecdhPrivateKeyPKCS8: ArrayBuffer;

        /* eslint-disable-next-line no-undef */
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

        it('testing key generation from a secret', async () => {
            const secret1 = 'secret';
            const kp1P384 = new BaseECKeyPair(Defaults.ECDSAP384R1KeyPairParams);
            await kp1P384.generateFromSecret(secret1);
            const priv1P384JWK = await kp1P384.privateKey.getJWK();
            expect(priv1P384JWK.x).toEqual('w1gvtQwf92CMdwO4Ksv6Me5Yfd0fEc1h_Wz72ucn7g_PHC2djB4Wv-lh2yM-T7cN');
            expect(priv1P384JWK.y).toEqual('I7v5192ITvh6yXYnw32ef9_HV6qcc2MkfLr2eZaurwSjgTygpoEhcGzcnjVza8ux');
            const kp1P256 = new BaseECKeyPair(Defaults.ECDSAP256R1KeyPairParams);
            await kp1P256.generateFromSecret(secret1);
            const priv1P256JWK = await kp1P256.privateKey.getJWK();
            expect(priv1P256JWK.x).toEqual('xE2IrGqimsZSmMUODGRTfmUioEamm99NKUHkzl6NjDs');
            expect(priv1P256JWK.y).toEqual('sEfYOHMMaImiQsyMkH6Zw98UbTSrVnR14hjRPBN0Pgw');

            const secret2 = new Uint8Array([0xff, 0x00, 0xff, 0x00]);
            const kp2P384 = new BaseECKeyPair(Defaults.ECDSAP384R1KeyPairParams);
            await kp2P384.generateFromSecret(secret2);
            const priv2P384JWK = await kp2P384.privateKey.getJWK();
            expect(priv2P384JWK.x).toEqual('8HPsDST5SPkMx8MMZusuQYRZ3smEiC8_do43l8BB7aUssm1J1n6zRhR03FDp-1jl');
            expect(priv2P384JWK.y).toEqual('b5dgtghUMBe-miCfjGzUeSVtxJpJ5uOMNRVl2n1WlvVhDjpwzeOWxAKVXt2wO76B');
            const kp2P256 = new BaseECKeyPair(Defaults.ECDSAP256R1KeyPairParams);
            await kp2P256.generateFromSecret(secret2);
            const priv2P256JWK = await kp2P256.privateKey.getJWK();
            expect(priv2P256JWK.x).toEqual('E0t4ixJv5Sw1w56J8Ir3k0r3rgLPbu28SkcgO30Re0Q');
            expect(priv2P256JWK.y).toEqual('6Llw1G7OZZu-Kso_-B7oj3Vcv6xztFzFjXQ7b1E_Peo');
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
