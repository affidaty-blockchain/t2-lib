import * as Errors from '../src/errors';
import * as BaseTypes from '../src/cryptography/baseTypes';
import * as Base from '../src/cryptography/base';
import * as Defaults from '../src/cryptography/cryptoDefaults';
import * as EllipticCurve from '../src/cryptography/baseECKey';
import { Subtle } from '../src/cryptography/webCrypto';
import { getAccountId, Account } from '../src/account';
import { BaseECKeyPair } from '../src/cryptography/baseECKeyPair';

describe('Testing ACCOUNT CLASS implementations', () => {
    const predefinedAccountId = 'QmamzDVuZqkUDwHikjHCkgJXhtgkbiVDTvTYb2aq6qfLbY';
    const predefinedPubKeyJWK: BaseTypes.IJwk = {
        key_ops: ['verify'],
        ext: true,
        kty: 'EC',
        crv: 'P-384',
        x: 'r7DpEuSCV9o86YR9UY3IQXRAPKTJA62kDzE-K_q-51TSl20TuyrWPqh99g_sdY8E',
        y: 'ycGxRyc2FbvsysfdSJvrIDkQFxJ04bFdJ01swPRikWYDaZLyohhEx8TA_d0bDphw',
    };
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
    it('init tests', async () => {
        const acc1 = new Account(Defaults.ECDSAP384R1KeyPairParams);
        await expect(acc1.generate()).resolves.toBeTruthy();
        const acc1Id = await getAccountId(acc1.keyPair.publicKey);
        expect(acc1Id).toEqual(acc1.accountId);

        const predefKeyPair = new BaseECKeyPair(Defaults.ECDSAP384R1KeyPairParams);
        await expect(predefKeyPair.publicKey.setJWK(predefinedPubKeyJWK))
            .resolves.toBeTruthy();
        const predefAccount = new Account();
        await expect(predefAccount.setKeyPair(predefKeyPair)).resolves.toBeTruthy();
        expect(predefAccount.accountId).toEqual(predefinedAccountId);
        await expect(getAccountId(predefAccount.keyPair.publicKey))
            .resolves.toEqual(predefinedAccountId);
    });
    it('exceptions tests', async () => {
        const emptyPubKey = new EllipticCurve.BaseECKey(Defaults.ECDSAP384R1PubKeyParams);
        await expect(getAccountId(emptyPubKey))
            .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));
        const keyPair = new BaseECKeyPair(Defaults.ECDSAP384R1KeyPairParams);
        let acc = new Account();
        await expect(acc.setKeyPair(keyPair))
            .rejects.toEqual(new Error(Errors.NO_BASE_KEY_VALUE));

        const customKeyPairParams: BaseTypes.IKeyPairParams = {
            publicKey: Defaults.ECDSAP384R1KeyPairParams.publicKey,
            privateKey: Defaults.ECDSAP384R1KeyPairParams.privateKey,
            usages: ['decrypt', 'encrypt'],
        };
        acc = new Account(customKeyPairParams);
        await expect(acc.generate())
            .rejects.toBeDefined();
    });
});
