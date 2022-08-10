import * as Errors from '../errors';
import {
    IJwk,
    IKeyParams,
} from './baseTypes';
import {
    BaseKey,
    keyBinToJWK,
    keyJWKToBin,
    compressRawCurvePoint,
    decompressRawCurvePoint,
    isCompressedCurvePoint,
} from './base';
import { mKeyPairParams } from './cryptoDefaults';

export type TECKeyType = 'public' | 'private' | 'undefined';

/**
 * Determines key type (public or private) from a JWK object scructure
 * @param jwk - JWK key object
 * @returns - key type
 */
function ecKeyTypeFromJWK(jwk: IJwk): TECKeyType {
    const jwkKeys = Object.keys(jwk);
    let type: TECKeyType;
    if (jwkKeys.indexOf('kty') === -1
        || jwk.kty !== 'EC'
        || jwkKeys.indexOf('x') === -1
        || jwkKeys.indexOf('y') === -1
        || jwkKeys.indexOf('crv') === -1
    ) {
        throw new Error(Errors.NOT_EC_KEY);
    } else if (jwkKeys.indexOf('d') === -1) {
        type = 'public';
    } else {
        type = 'private';
    }
    return type;
}

/**
 * Basic elliptic curve key class, extended by other, more specific classes
 */
export class BaseECKey extends BaseKey {
    private _raw: Uint8Array = new Uint8Array(0);

    private _spki: Uint8Array = new Uint8Array(0);

    private _pkcs8: Uint8Array = new Uint8Array(0);

    protected _clear(): void {
        this._raw = new Uint8Array(0);
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
                this.type = ecKeyTypeFromJWK(jwk);
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
     * Sets key value from raw bytes (public key)
     * @param raw - raw public keys
     */
    public setRaw(
        raw: Uint8Array,
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const _raw = isCompressedCurvePoint(raw)
                ? decompressRawCurvePoint(raw, this.paramsId.substring(this.paramsId.indexOf('_') + 1))
                : raw;
            keyBinToJWK(_raw, 'oct', { namedCurve: this.keyParams.genAlgorithm!.namedCurve })
                .then((importedJwk: IJwk) => {
                    if (ecKeyTypeFromJWK(importedJwk) === 'public') {
                        this.setJWK(importedJwk);
                        this._raw = _raw;
                        return resolve(true);
                    }
                    return reject(new Error(Errors.NOT_PUBLIC_EC_BYTES));
                })
                .catch((error:any) => { return reject(error); });
        });
    }

    /**
     * Outputs key value as raw bytes (public key)
     * @returns - raw public key bytes
     */
    public getRaw(compress: boolean = false): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            if (this.type !== 'public') {
                return reject(new Error(Errors.ONLY_FOR_PUBKEY));
            }
            if (this._raw.byteLength > 0) {
                return resolve(compress ? compressRawCurvePoint(this._raw) : this._raw);
            }
            this.getJWK()
                .then((jwk: IJwk) => {
                    keyJWKToBin(jwk, 'oct')
                        .then((exportedBin) => {
                            this._raw = exportedBin;
                            return resolve(compress ? compressRawCurvePoint(this._raw) : this._raw);
                        })
                        .catch((error:any) => { return reject(error); });
                })
                .catch((error:any) => { return reject(error); });
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
                    if (ecKeyTypeFromJWK(importedJwk) === 'public') {
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
                    if (ecKeyTypeFromJWK(importedJwk) === 'private') {
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
    public getPKCS8(): Promise<Uint8Array> {
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
    public extractPublic(passedPubKeyParams?: IKeyParams): Promise<BaseECKey> {
        return new Promise((resolve, reject) => {
            if (this.type !== 'private') {
                return reject(new Error(Errors.ONLY_FOR_PRIVKEY));
            }
            this.getJWK()
                .then((privKeyJWK) => {
                    const newPubKeyJWK = { ...privKeyJWK };
                    delete newPubKeyJWK.d;
                    let newPubKeyParams = { ...passedPubKeyParams };
                    if (
                        typeof newPubKeyParams === 'undefined'
                        || typeof newPubKeyParams.paramsId === 'undefined'
                    ) {
                        if (!mKeyPairParams.has(this.paramsId)) {
                            return reject(new Error(Errors.NO_PREDEF_KEY_PARAMS_ID));
                        }
                        newPubKeyParams = mKeyPairParams.get(this.paramsId)!.publicKey;
                    }
                    const newPubKey = new BaseECKey({
                        paramsId: newPubKeyParams.paramsId!,
                        genAlgorithm: newPubKeyParams.genAlgorithm!,
                        usages: newPubKeyParams.usages!,
                        type: newPubKeyParams.type!,
                    });
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

    /**
     * This method will automatically detect binary format
     * and import it using appropriate format-specific import method.
     * @param binaryKey - Key to import in binary format
     */
    public importBin(binaryKey: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (binaryKey.byteLength === 0) {
                return reject(new Error(Errors.EMPTY_VALUE));
            }
            const firstByte: number = binaryKey[0];
            if (this.type === 'public') {
                switch (firstByte) {
                    case 4: case 2: case 3:
                        this.setRaw(binaryKey)
                            .then((result: boolean) => {
                                return resolve(result);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                        break;
                    case 48:
                        this.setSPKI(binaryKey)
                            .then((result: boolean) => {
                                return resolve(result);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
                        break;
                    default:
                        return reject(new Error(Errors.KEY_IMPORT_UNKNOWN_FORMAT));
                }
            } else if (this.type === 'private') {
                this.setPKCS8(binaryKey)
                    .then((result: boolean) => {
                        return resolve(result);
                    })
                    .catch((error: any) => {
                        return reject(error);
                    });
            } else {
                return reject(new Error(Errors.KEY_IMPORT_CLASS_NOT_INIT));
            }
        });
    }
}
