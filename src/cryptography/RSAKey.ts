import * as Errors from '../errors';
import {
    IJwk,
    IKeyParams,
    BaseKey,
    keyBinToJWK,
    keyJWKToBin,
    TValidKeyType,
} from './base';
import { mKeyPairParams, RSAOAEP384KeyPairParams as defaultParams } from './cryptoDefaults';

/**
 * Determines key type (public or private) from a JWK object scructure
 * @param jwk - JWK key object
 * @returns - key type
 */
function rsaKeyTypeFromJWK(jwk: IJwk): TValidKeyType {
    const jwkKeys = Object.keys(jwk);
    let type: TValidKeyType;
    if (jwkKeys.indexOf('kty') === -1
        || jwk.kty !== 'RSA'
        || jwkKeys.indexOf('n') === -1
        || jwkKeys.indexOf('e') === -1
    ) {
        throw new Error(Errors.NOT_RSA_KEY);
    } else if (jwkKeys.indexOf('d') === -1) {
        type = 'public';
    } else {
        type = 'private';
    }
    return type;
}

type TKeyType = 'public' | 'private';

/**
 * Basic RSA key class, extended by other, more specific classes
 */
export class RSAKey extends BaseKey {
    private _spki: Uint8Array = new Uint8Array(0);

    private _pkcs8: Uint8Array = new Uint8Array(0);

    constructor(keyType: TKeyType, keyParams?: IKeyParams) {
        super();
        switch (keyType) {
            case 'public':
                super.keyParams = typeof keyParams === 'undefined' ? defaultParams.publicKey : keyParams;
                super.type = 'public';
                break;
            default:
                super.keyParams = typeof keyParams === 'undefined' ? defaultParams.privateKey : keyParams;
                super.type = 'private';
                break;
        }
    }

    protected _clear(): void {
        this._spki = new Uint8Array(0);
        this._pkcs8 = new Uint8Array(0);
        this._clearBase();
    }

    /**
     * @returns - true if the key is a public key
     */
    public isPublic(): boolean {
        return this.type === 'public';
    }

    /**
     * @returns true if key is a private key
     */
    public isPrivate(): boolean {
        return this.type === 'private';
    }

    /**
     * Set key value from a JWK object
     * @param jwk - JWK object from which to take key value
     * @param doClear - set to false (true by default) to not to clean already set key values
     */
    public setJWK(
        jwk: IJwk,
        doClear: boolean = true,
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.type = rsaKeyTypeFromJWK(jwk);
            } catch (error) {
                return reject(error);
            }
            this._clear();
            super.setJWK(jwk, doClear);
            return resolve(true);
        });
    }

    /**
     * Sets the key value from a standard CryptoKey object, used by SubtleCrypto
     * @param cryptoKey - CryptoKey object
     * @param doClear - set to false (true by default) to not to clean already set key values
     */
    public setCryptoKey(cryptoKey: CryptoKey, doClear: boolean = true): Promise<boolean> {
        return new Promise((resolve) => {
            this.type = cryptoKey.type;
            super.setCryptoKey(cryptoKey, doClear);
            return resolve(true);
        });
    }

    /**
     * Sets key value from SPKI bytes (public key)
     * @param spki - SPKI public key bytes
     */
    public setSPKI(
        spki: Uint8Array,
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            keyBinToJWK(spki)
                .then((importedJwk: IJwk) => {
                    if (rsaKeyTypeFromJWK(importedJwk) === 'public') {
                        this.setJWK(importedJwk);
                        this._spki = spki;
                        return resolve(true);
                    }
                    return reject(new Error(Errors.NOT_PUBLIC_EC_BYTES));
                })
                .catch((error:any) => { return reject(error); });
        });
    }

    /**
     * Outputs key value as SPKI bytes (public key)
     * @returns - SPKI public key bytes
     */
    public getSPKI(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            if (this.type !== 'public') {
                return reject(new Error(Errors.ONLY_FOR_PUBKEY));
            }
            if (this._spki.byteLength > 0) {
                return resolve(this._spki);
            }
            this.getJWK()
                .then((jwk: IJwk) => {
                    keyJWKToBin(jwk)
                        .then((exportedBin) => {
                            this._spki = exportedBin;
                            return resolve(exportedBin);
                        })
                        .catch((error:any) => { return reject(error); });
                })
                .catch((error:any) => { return reject(error); });
        });
    }

    /**
     * Sets key value from PKCS8 bytes (private key)
     * @param pkcs8 - PKCS8 private key bytes
     */
    public setPKCS8(
        pkcs8: Uint8Array,
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            keyBinToJWK(pkcs8)
                .then((importedJwk: IJwk) => {
                    if (rsaKeyTypeFromJWK(importedJwk) === 'private') {
                        this.setJWK(importedJwk);
                        this._pkcs8 = pkcs8;
                        return resolve(true);
                    }
                    return reject(new Error(Errors.NOT_PRIVATE_EC_BYTES));
                })
                .catch((error:any) => { return reject(error); });
        });
    }

    /**
     * Outputs key value as PKCS8 bytes (private key)
     * @returns - PKCS private key bytes
     */
    public getPKCS8(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.type !== 'private') {
                return reject(new Error(Errors.ONLY_FOR_PRIVKEY));
            }
            if (this._pkcs8.byteLength > 0) {
                return resolve(this._pkcs8);
            }
            this.getJWK()
                .then((jwk: IJwk) => {
                    keyJWKToBin(jwk)
                        .then((exportedBin) => {
                            this._pkcs8 = exportedBin;
                            return resolve(exportedBin);
                        })
                        .catch((error:any) => { return reject(error); });
                })
                .catch((error:any) => { return reject(error); });
            // ecJwkToBin(this.getJwk());
        });
    }

    /**
     * This function will extract public key from private key object.
     * @param passedPubKeyParams - optional new key object params.
     * If omitted function will try to find public key params inside
     * KeyPairParams corresponding to the private key paramsId
     * @returns - public key object
     */
    public extractPublic(passedPubKeyParams?: IKeyParams): Promise<RSAKey> {
        return new Promise((resolve, reject) => {
            if (this.type !== 'private') {
                return reject(new Error(Errors.ONLY_FOR_PRIVKEY));
            }
            this.getJWK()
                .then((privKeyJWK) => {
                    const newPubKeyJWK = privKeyJWK;
                    delete newPubKeyJWK.d;
                    delete newPubKeyJWK.p;
                    delete newPubKeyJWK.q;
                    delete newPubKeyJWK.dp;
                    delete newPubKeyJWK.dq;
                    delete newPubKeyJWK.qi;
                    let newPubKeyParams = passedPubKeyParams;
                    if (typeof newPubKeyParams === 'undefined') {
                        if (!mKeyPairParams.has(this.paramsId)) {
                            return reject(new Error(Errors.NO_PREDEF_KEY_PARAMS_ID));
                        }
                        newPubKeyParams = mKeyPairParams.get(this.paramsId)!.publicKey;
                    }
                    const newPubKey = new RSAKey('public', newPubKeyParams);
                    newPubKey.setJWK(newPubKeyJWK)
                        .then(() => {
                            return resolve(newPubKey);
                        })
                        .catch((error: any) => {
                            return reject(error);
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
