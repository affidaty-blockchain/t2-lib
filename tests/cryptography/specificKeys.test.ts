import * as Defaults from '../../src/cryptography/cryptoDefaults';
import { ECDHKey, deriveKeyFromECDH } from '../../src/cryptography/ECDHKey';
import { ECDHKeyPair } from '../../src/cryptography/ECDHKeyPair';
import { ECDSAKey } from '../../src/cryptography/ECDSAKey';
import { ECDSAKeyPair } from '../../src/cryptography/ECDSAKeyPair';
import { RSAKeyPair } from '../../src/cryptography/RSAKeyPair';

describe('Testing specific keys classes', () => {
    it('Testing ECDSA classes', async () => {
        const ecdsaKeyPair = new ECDSAKeyPair();
        await ecdsaKeyPair.generate();
        const ecdsaPubKeyRaw = await ecdsaKeyPair.publicKey.getRaw();
        const ecdsaPubKeySPKI = await ecdsaKeyPair.publicKey.getSPKI();
        const ecdsaPubKeyJWK = await ecdsaKeyPair.publicKey.getJWK();
        const ecdsaPrivKeyPKCS8 = await ecdsaKeyPair.privateKey.getPKCS8();
        const ecdsaPrivKeyJWK = await ecdsaKeyPair.privateKey.getJWK();

        let ecdsaPubKey = new ECDSAKey('public');
        await ecdsaPubKey.setRaw(ecdsaPubKeyRaw);
        await expect(ecdsaPubKey.getRaw()).resolves.toEqual(ecdsaPubKeyRaw);
        await expect(ecdsaPubKey.getSPKI()).resolves.toEqual(ecdsaPubKeySPKI);
        await expect(ecdsaPubKey.getJWK()).resolves.toEqual(ecdsaPubKeyJWK);
        ecdsaPubKey = new ECDSAKey('public');
        await ecdsaPubKey.setSPKI(ecdsaPubKeySPKI);
        await expect(ecdsaPubKey.getRaw()).resolves.toEqual(ecdsaPubKeyRaw);
        await expect(ecdsaPubKey.getSPKI()).resolves.toEqual(ecdsaPubKeySPKI);
        await expect(ecdsaPubKey.getJWK()).resolves.toEqual(ecdsaPubKeyJWK);
        ecdsaPubKey = new ECDSAKey('public');
        await ecdsaPubKey.setJWK(ecdsaPubKeyJWK);
        await expect(ecdsaPubKey.getRaw()).resolves.toEqual(ecdsaPubKeyRaw);
        await expect(ecdsaPubKey.getSPKI()).resolves.toEqual(ecdsaPubKeySPKI);
        await expect(ecdsaPubKey.getJWK()).resolves.toEqual(ecdsaPubKeyJWK);

        let ecdsaPrivKey = new ECDSAKey('private');
        await ecdsaPrivKey.setPKCS8(ecdsaPrivKeyPKCS8);
        await expect(ecdsaPrivKey.getPKCS8()).resolves.toEqual(ecdsaPrivKeyPKCS8);
        await expect(ecdsaPrivKey.getJWK()).resolves.toEqual(ecdsaPrivKeyJWK);
        ecdsaPrivKey = new ECDSAKey('private');
        await ecdsaPrivKey.setJWK(ecdsaPrivKeyJWK);
        await expect(ecdsaPrivKey.getPKCS8()).resolves.toEqual(ecdsaPrivKeyPKCS8);
        await expect(ecdsaPrivKey.getJWK()).resolves.toEqual(ecdsaPrivKeyJWK);
    });
    it('Testing ECDH classes', async () => {
        const ecdhKeyPair = new ECDHKeyPair();
        await ecdhKeyPair.generate();
        const ecdhPubKeyRaw = await ecdhKeyPair.publicKey.getRaw();
        const ecdhPubKeySPKI = await ecdhKeyPair.publicKey.getSPKI();
        const ecdhPubKeyJWK = await ecdhKeyPair.publicKey.getJWK();
        const ecdhPrivKeyPKCS8 = await ecdhKeyPair.privateKey.getPKCS8();
        const ecdhPrivKeyJWK = await ecdhKeyPair.privateKey.getJWK();

        let ecdhPubKey = new ECDHKey('public');
        await ecdhPubKey.setRaw(ecdhPubKeyRaw);
        await expect(ecdhPubKey.getRaw()).resolves.toEqual(ecdhPubKeyRaw);
        await expect(ecdhPubKey.getSPKI()).resolves.toEqual(ecdhPubKeySPKI);
        await expect(ecdhPubKey.getJWK()).resolves.toEqual(ecdhPubKeyJWK);
        ecdhPubKey = new ECDHKey('public');
        await ecdhPubKey.setSPKI(ecdhPubKeySPKI);
        await expect(ecdhPubKey.getRaw()).resolves.toEqual(ecdhPubKeyRaw);
        await expect(ecdhPubKey.getSPKI()).resolves.toEqual(ecdhPubKeySPKI);
        await expect(ecdhPubKey.getJWK()).resolves.toEqual(ecdhPubKeyJWK);
        ecdhPubKey = new ECDHKey('public');
        await ecdhPubKey.setJWK(ecdhPubKeyJWK);
        await expect(ecdhPubKey.getRaw()).resolves.toEqual(ecdhPubKeyRaw);
        await expect(ecdhPubKey.getSPKI()).resolves.toEqual(ecdhPubKeySPKI);
        await expect(ecdhPubKey.getJWK()).resolves.toEqual(ecdhPubKeyJWK);

        let ecdhPrivKey = new ECDHKey('private');
        await ecdhPrivKey.setPKCS8(ecdhPrivKeyPKCS8);
        await expect(ecdhPrivKey.getPKCS8()).resolves.toEqual(ecdhPrivKeyPKCS8);
        await expect(ecdhPrivKey.getJWK()).resolves.toEqual(ecdhPrivKeyJWK);
        ecdhPrivKey = new ECDHKey('private');
        await ecdhPrivKey.setJWK(ecdhPrivKeyJWK);
        await expect(ecdhPrivKey.getPKCS8()).resolves.toEqual(ecdhPrivKeyPKCS8);
        await expect(ecdhPrivKey.getJWK()).resolves.toEqual(ecdhPrivKeyJWK);

        const ecdhKeyPair1 = new ECDHKeyPair();
        await ecdhKeyPair1.generate();
        const ecdhKeyPair2 = new ECDHKeyPair();
        await ecdhKeyPair2.generate();
        const derivedKey1 = await deriveKeyFromECDH(
            ecdhKeyPair1.publicKey,
            ecdhKeyPair2.privateKey,
            Defaults.AESGCM256KeyParams,
        );
        const derivedKey2 = await deriveKeyFromECDH(
            ecdhKeyPair2.publicKey,
            ecdhKeyPair1.privateKey,
            Defaults.AESGCM256KeyParams,
        );
        expect(await derivedKey1.getJWK()).toEqual(await derivedKey2.getJWK());
    });
    it('Testing RSA classes', async () => {
        const rsaKeyPair = new RSAKeyPair();
        await rsaKeyPair.generate();
        const rsaPubKeySPKI = await rsaKeyPair.publicKey.getSPKI();
        const rsaPrivKeyPKCS8 = await rsaKeyPair.privateKey.getPKCS8();
        const rsaPubKeyJWK = await rsaKeyPair.publicKey.getJWK();
        expect(rsaPubKeySPKI.byteLength).toBeGreaterThan(0);
        expect(rsaPrivKeyPKCS8.byteLength).toBeGreaterThan(0);
        expect(rsaPubKeyJWK.kty).toEqual('RSA');
    });
});
