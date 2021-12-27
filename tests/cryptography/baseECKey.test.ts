import * as Errors from '../../src/errors';
import * as BaseTypes from '../../src/cryptography/baseTypes';
import * as Base from '../../src/cryptography/base';
import * as Defaults from '../../src/cryptography/cryptoDefaults';
import * as EllipticCurve from '../../src/cryptography/baseECKey';
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
            const testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PrivKeyParams);
            expect(testBaseECKey.paramsId).toEqual(
                Defaults.ECDSAP384R1PrivKeyParams.paramsId,
            );
            expect(testBaseECKey.keyParams).toEqual(Defaults.ECDSAP384R1PrivKeyParams);
            expect(testBaseECKey.keyParams).toEqual(
                Defaults.mKeyPairParams.get(
                    Defaults.EKeyParamsIds.ECDSAP384R1,
                )!.privateKey,
            );
            const testBaseECKey2 = new EllipticCurve.BaseECKey(Defaults.ECDHP384R1PrivKeyParams);
            expect(testBaseECKey2.paramsId).toEqual(
                Defaults.ECDHP384R1PrivKeyParams.paramsId,
            );
            expect(testBaseECKey2.keyParams).toEqual(Defaults.ECDHP384R1PrivKeyParams);
            expect(testBaseECKey2.keyParams).toEqual(
                Defaults.mKeyPairParams.get(
                    Defaults.EKeyParamsIds.ECDHP384R1,
                )!.privateKey,
            );
        });
        it('testing conversions', async () => {
            let testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PubKeyParams);
            await testBaseECKey.setCryptoKey(ecdsaKeyPair.publicKey);
            expect(testBaseECKey.type).toEqual('public');
            expect(testBaseECKey.isPublic()).toBeTruthy();
            expect(testBaseECKey.isPrivate()).toBeFalsy();
            await expect(testBaseECKey.getCryptoKey()).resolves.toEqual(
                ecdsaKeyPair.publicKey,
            );
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );
            await expect(testBaseECKey.getRaw()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeyRaw),
            );
            await expect(testBaseECKey.getSPKI()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeySPKI),
            );

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PubKeyParams);
            await testBaseECKey.setJWK(ecdsaPublicKeyJwk);
            expect(testBaseECKey.type).toEqual('public');
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );
            await expect(testBaseECKey.getRaw()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeyRaw),
            );
            await expect(testBaseECKey.getSPKI()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeySPKI),
            );

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PubKeyParams);
            await testBaseECKey.setRaw(new Uint8Array(ecdsaPublicKeyRaw));
            expect(testBaseECKey.type).toEqual('public');
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );
            await expect(testBaseECKey.getRaw()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeyRaw),
            );
            await expect(testBaseECKey.getSPKI()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeySPKI),
            );

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PubKeyParams);
            await testBaseECKey.setSPKI(new Uint8Array(ecdsaPublicKeySPKI));
            expect(testBaseECKey.type).toEqual('public');
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );
            await expect(testBaseECKey.getRaw()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeyRaw),
            );
            await expect(testBaseECKey.getSPKI()).resolves.toEqual(
                new Uint8Array(ecdsaPublicKeySPKI),
            );

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PrivKeyParams);
            await testBaseECKey.setCryptoKey(ecdsaKeyPair.privateKey);
            expect(testBaseECKey.type).toEqual('private');
            await expect(testBaseECKey.getCryptoKey()).resolves.toEqual(
                ecdsaKeyPair.privateKey,
            );
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPrivateKeyJwk,
            );
            await expect(testBaseECKey.getPKCS8()).resolves.toEqual(
                new Uint8Array(ecdsaPrivateKeyPKCS8),
            );

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PrivKeyParams);
            await testBaseECKey.setJWK(ecdsaPrivateKeyJwk);
            expect(testBaseECKey.type).toEqual('private');
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPrivateKeyJwk,
            );
            await expect(testBaseECKey.getPKCS8()).resolves.toEqual(
                new Uint8Array(ecdsaPrivateKeyPKCS8),
            );

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PrivKeyParams);
            await testBaseECKey.setPKCS8(new Uint8Array(ecdsaPrivateKeyPKCS8));
            expect(testBaseECKey.type).toEqual('private');
            await expect(testBaseECKey.getJWK()).resolves.toEqual(
                ecdsaPrivateKeyJwk,
            );
            await expect(testBaseECKey.getPKCS8()).resolves.toEqual(
                new Uint8Array(ecdsaPrivateKeyPKCS8),
            );
            const newPubKey = await testBaseECKey.extractPublic();
            await expect(newPubKey.getRaw()).resolves.toEqual(new Uint8Array(ecdsaPublicKeyRaw));
        });
        it('testing class exceptions', async () => {
            const testBaseECPubKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PubKeyParams);
            testBaseECPubKey.type = 'public';
            const emptyUint8Array = new Uint8Array(0);
            await expect(testBaseECPubKey.getRaw())
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            await expect(testBaseECPubKey.getSPKI())
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            await testBaseECPubKey.setCryptoKey(ecdsaKeyPair.publicKey);
            await expect(testBaseECPubKey.getPKCS8())
                .rejects.toEqual(new Error(Errors.ONLY_FOR_PRIVKEY));
            await expect(testBaseECPubKey.setRaw(emptyUint8Array))
                .rejects.toEqual(new Error(Errors.EMPTY_VALUE));
            await expect(testBaseECPubKey.setSPKI(emptyUint8Array))
                .rejects.toEqual(new Error(Errors.EMPTY_VALUE));
            await expect(testBaseECPubKey.setSPKI(new Uint8Array(ecdsaPrivateKeyPKCS8)))
                .rejects.toEqual(new Error(Errors.NOT_PUBLIC_EC_BYTES));
            await expect(testBaseECPubKey.setPKCS8(emptyUint8Array))
                .rejects.toEqual(new Error(Errors.EMPTY_VALUE));
            await expect(testBaseECPubKey.extractPublic())
                .rejects.toEqual(new Error(Errors.ONLY_FOR_PRIVKEY));

            const testBaseECPrivKey = new EllipticCurve.BaseECKey(
                Defaults.ECDSAP384R1PrivKeyParams,
            );
            testBaseECPrivKey.type = 'private';
            await expect(testBaseECPrivKey.setPKCS8(new Uint8Array(ecdsaPublicKeySPKI)))
                .rejects.toEqual(new Error(Errors.NOT_PRIVATE_EC_BYTES));
            await expect(testBaseECPrivKey.getPKCS8())
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            testBaseECPrivKey.setCryptoKey(ecdsaKeyPair.privateKey);
            await expect(testBaseECPrivKey.getRaw())
                .rejects.toEqual(new Error(Errors.ONLY_FOR_PUBKEY));
            await expect(testBaseECPrivKey.getSPKI())
                .rejects.toEqual(new Error(Errors.ONLY_FOR_PUBKEY));

            let testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PrivKeyParams);
            await expect(testBaseECKey.setJWK(rsaPrivateKeyJwk))
                .rejects.toEqual(new Error(Errors.NOT_EC_KEY));
            await expect(testBaseECKey.setJWK({ key_ops: [], kty: 'ASD', ext: false }))
                .rejects.toEqual(new Error(Errors.NOT_EC_KEY));
            await expect(testBaseECKey.setPKCS8(new Uint8Array(rsaPrivateKeyPKCS8)))
                .rejects.toEqual(new Error(Errors.NOT_EC_KEY));

            testBaseECKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PrivKeyParams);
            await expect(testBaseECKey.setRaw(new Uint8Array([0x01, 0xff, 0xff, 0xff])))
                .rejects.toEqual(new Error(Errors.NOT_PUBLIC_EC_BYTES));

            const customEcdsaParams = Defaults.ECDSAP384R1PrivKeyParams;
            customEcdsaParams.paramsId = 'my_custom_id';
            testBaseECKey = new EllipticCurve.BaseECKey(customEcdsaParams);
            testBaseECKey.type = 'private';
            await expect(testBaseECKey.extractPublic())
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            await testBaseECKey.setJWK(ecdsaPrivateKeyJwk);
            await expect(testBaseECKey.extractPublic())
                .rejects.toEqual(new Error(Errors.NO_PREDEF_KEY_PARAMS_ID));
        });
    });
});
