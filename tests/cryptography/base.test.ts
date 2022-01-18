import * as Errors from '../../src/errors';
import * as BaseTypes from '../../src/cryptography/baseTypes';
import * as Base from '../../src/cryptography/base';
import * as Defaults from '../../src/cryptography/cryptoDefaults';
import { Subtle } from '../../src/cryptography/webCrypto';

describe('Testing base cryptography implementations', () => {
    describe('Testing base key with ECDSA default parameters', () => {
        let ecdhKeyPair1: CryptoKeyPair;
        let ecdsaKeyPair: CryptoKeyPair;
        let ecdsaPublicKeyJwk: BaseTypes.IJwk;
        let ecdsaPrivateKeyJwk: BaseTypes.IJwk;

        let rsaKeyPair: CryptoKeyPair;
        let rsaPrivateKeyJwk: BaseTypes.IJwk;
        let rsaPrivateKeyPKCS8: ArrayBuffer;

        it('setting control values', async () => {
            ecdhKeyPair1 = await Subtle.generateKey(
                Defaults.ECDHP384R1PrivKeyParams.genAlgorithm,
                false,
                Defaults.ECDHP384R1KeyPairParams.usages,
            );
            ecdsaKeyPair = await Subtle.generateKey(
                Defaults.ECDSAP384R1PrivKeyParams.genAlgorithm,
                true,
                Defaults.ECDSAP384R1KeyPairParams.usages,
            );
            expect(ecdsaKeyPair).toBeDefined();
            expect(ecdsaKeyPair.publicKey).toBeDefined();
            expect(ecdsaKeyPair.privateKey).toBeDefined();
            ecdsaPublicKeyJwk = await Subtle.exportKey('jwk', ecdsaKeyPair.publicKey);
            ecdsaPrivateKeyJwk = await Subtle.exportKey('jwk', ecdsaKeyPair.privateKey);
            expect(ecdsaPublicKeyJwk).toBeDefined();
            expect(ecdsaPrivateKeyJwk).toBeDefined();

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
            const testBaseKey = new Base.BaseKey(Defaults.ECDSAP384R1PrivKeyParams);
            expect(testBaseKey.paramsId).toEqual(Defaults.ECDSAP384R1PrivKeyParams.paramsId);
            expect(testBaseKey.keyParams).toEqual(Defaults.ECDSAP384R1PrivKeyParams);
            expect(testBaseKey.keyParams).toEqual(
                Defaults.mKeyPairParams.get(
                    Defaults.EKeyParamsIds.ECDSAP384R1,
                )!.privateKey,
            );
        });
        it('testing class conversions', async () => {
            let testBaseKey = new Base.BaseKey(Defaults.ECDSAP384R1PubKeyParams);
            testBaseKey.setCryptoKey(ecdsaKeyPair.publicKey!);
            await expect(testBaseKey.getCryptoKey()).resolves.toEqual(
                ecdsaKeyPair.publicKey,
            );
            await expect(testBaseKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );
            await expect(testBaseKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );
            testBaseKey.setJWK(ecdsaPublicKeyJwk);
            await expect(testBaseKey.getJWK()).resolves.toEqual(
                ecdsaPublicKeyJwk,
            );

            testBaseKey = new Base.BaseKey(Defaults.ECDSAP384R1PrivKeyParams);
            testBaseKey.setCryptoKey(ecdsaKeyPair.privateKey!);
            await expect(testBaseKey.getCryptoKey()).resolves.toEqual(
                ecdsaKeyPair.privateKey,
            );
            await expect(testBaseKey.getJWK()).resolves.toEqual(
                ecdsaPrivateKeyJwk,
            );
            await expect(testBaseKey.getJWK()).resolves.toEqual(
                ecdsaPrivateKeyJwk,
            );

            testBaseKey.setJWK(ecdsaPrivateKeyJwk);
            await expect(testBaseKey.getJWK()).resolves.toEqual(
                ecdsaPrivateKeyJwk,
            );
        });
        it('testing class exceptions', async () => {
            let testError;
            let testObj;
            try {
                testObj = new Base.BaseKey({ paramsId: 'asd', genAlgorithm: { name: 'ECDSA' }, type: 'undefined' });
            } catch (e) {
                testError = e;
            }
            expect(testObj).toBeUndefined();
            expect(testError).toEqual(new Error(Errors.UNDEF_KEY_USAGES));

            testError = undefined;
            testObj = undefined;
            try {
                testObj = new Base.BaseKey({ paramsId: 'asd', usages: ['decrypt'], type: 'undefined' });
            } catch (e) {
                testError = e;
            }
            expect(testObj).toBeUndefined();
            expect(testError).toEqual(new Error(Errors.UNDEF_KEY_GEN_ALGORITHM));

            let testBaseKey = new Base.BaseKey(Defaults.ECDSAP384R1PrivKeyParams);
            try {
                testBaseKey.keyParams = Defaults.ECDHP384R1PrivKeyParams;
            } catch (e) {
                testError = e;
            }
            expect(testError).toEqual(new Error(Errors.KEY_PARAMS_REDEFINITION));
            await expect(testBaseKey.getJWK())
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            await expect(testBaseKey.getCryptoKey())
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            testBaseKey.setJWK({ key_ops: ['verify'], ext: false, kty: 'asd' });
            await expect(testBaseKey.getCryptoKey())
                .rejects.toBeDefined();

            testError = undefined;
            try {
                testBaseKey.setCryptoKey(ecdhKeyPair1.privateKey!);
            } catch (error) {
                testError = error;
            }
            expect(testError).toEqual(new Error(Errors.IMPORT_ALG_ERROR));

            const ecdsaUsagesLengthMismatchKeyPair = await Subtle.generateKey(
                Defaults.ECDSAP384R1PrivKeyParams.genAlgorithm,
                true,
                [],
            );
            testError = undefined;
            try {
                testBaseKey.setCryptoKey(ecdsaUsagesLengthMismatchKeyPair.privateKey);
            } catch (error) {
                testError = error;
            }
            expect(testError).toEqual(new Error(Errors.IMPORT_USAGES_ERROR));

            const testParams: BaseTypes.IKeyParams = {
                paramsId: 'test_params',
                genAlgorithm: {
                    name: 'ECDSA',
                    namedCurve: 'P-384',
                },
                usages: ['unwrapKey'],
                type: 'private',
            };
            testBaseKey = new Base.BaseKey(testParams);
            testError = undefined;
            try {
                testBaseKey.setCryptoKey(ecdsaKeyPair.privateKey!);
            } catch (error) {
                testError = error;
            }
            expect(testError).toEqual(new Error(Errors.IMPORT_USAGES_ERROR));
        });
        it('testing functions exceptions', async () => {
            await expect(Base.keyBinToJWK(new Uint8Array([0xFF])))
                .rejects.toEqual(new Error('FailedToDecodeKey'));
            await expect(Base.keyJWKToBin({ key_ops: [], kty: 'ASD', ext: false }))
                .rejects.toEqual(new Error('UnsupportedJWKType'));
            await expect(Base.keyJWKToBin({
                key_ops: [], kty: 'EC', ext: false, crv: 'P-384', x: '', y: '', d: '',
            }))
                .rejects.toEqual(new Error('InvalidECKey'));
            await expect(Base.keyJWKToBin(rsaPrivateKeyJwk, 'oct'))
                .rejects.toEqual(new Error('UnsupportedConversion'));

            await expect(Base.exportCryptoKey('jwk'))
                .rejects.toEqual(new Error(Errors.UNDEF_EXPORTED_KEY));
            await expect(Base.importCryptoKey('jwk', 'key', undefined, true))
                .rejects.toEqual(new Error(Errors.UNDEF_KEY_IMPORT_ALGORITHM));

            const testBaseKey = new Base.BaseKey(Defaults.ECDHP384R1PrivKeyParams);
            const testData = new Uint8Array([0xff, 0xfe, 0xfd]);
            await expect(Base.signData(testBaseKey, testData, 'SHA-384'))
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
            await expect(Base.verifyDataSignature(testBaseKey, testData, testData, 'SHA-384'))
                .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));

            testBaseKey.setCryptoKey(ecdhKeyPair1.privateKey!);
            await expect(Base.signData(testBaseKey, testData, 'SHA-384'))
                .rejects.toBeDefined();
            await expect(Base.verifyDataSignature(testBaseKey, testData, testData, 'SHA-384'))
                .rejects.toBeDefined();
        });
    });
});
