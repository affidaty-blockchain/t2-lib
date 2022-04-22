import { Key as UtilKey } from 'js-crypto-key-utils';
import * as baseTypes from './baseTypes';
import * as Errors from '../errors';
import { Subtle } from './webCrypto';
import { similarArrays } from '../utils';
import { EmptyKeyParams } from './cryptoDefaults';

type TecKeyBinFormat = 'oct' | 'der' | 'pem';

/**
 * Converts binary key data into a JWK object
 * @param bin - key in binary format
 * @param format - binary input format
 * @param importOptions - do not touch
 * @param exportOptions - do not touch
 * @returns - JWK key object
 */
export function keyBinToJWK(
    bin: Uint8Array,
    binFormat: TecKeyBinFormat = 'der',
    importOptions: object = {},
    exportOptions: object = {},
): Promise<baseTypes.IJwk> {
    return new Promise((resolve, reject) => {
        if (bin.byteLength === 0) {
            return reject(new Error(Errors.EMPTY_VALUE));
        }
        const keyObj = new UtilKey(binFormat, bin, importOptions);
        keyObj.export('jwk', exportOptions)
            .then((exportedJwk:any) => {
                const result: baseTypes.IJwk = exportedJwk;
                return resolve(result);
            })
            .catch((error:any) => { return reject(error); });
    });
}

/**
 * Converts binary key data into a JWK key object into binary data
 * @param bin - key in binary format
 * @param binFormat - binary output format
 * @param importOptions - do not touch
 * @param exportOptions - do not touch
 * @returns - binary key data
 */
export function keyJWKToBin(
    jwk: baseTypes.IJwk,
    binFormat: TecKeyBinFormat = 'der',
    importOptions: object = {},
    exportOptions: object = {},
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const keyObj = new UtilKey('jwk', jwk, importOptions);
        keyObj.export(binFormat, exportOptions)
            .then((exportedBin:any) => {
                const result = exportedBin;
                return resolve(result);
            })
            .catch((error:any) => { return reject(error); });
    });
}

/**
 * Adds/corrects missing required fields to a JWK object
 * @param jwk - source JWK
 * @param jwkOps - needed key_ops value
 * @param jwkExt - needed ext value
 * @returns - corrected JWK object
 */
function correctJwkFields(
    jwk: baseTypes.IJwk,
    jwkOps: baseTypes.TKeyUsages,
    jwkExt: boolean,
): baseTypes.IJwk {
    const tempJwk: baseTypes.IJwk = { ...jwk };
    tempJwk.key_ops = jwkOps;
    tempJwk.ext = jwkExt;
    return tempJwk;
}

/**
 * converts CryptoKey into other formats
 * @param format - expected output format
 * @param key - CryptoKey object to convert
 * @returns - key convertted to desired format
 */
export function exportCryptoKey(
    format: baseTypes.TValidKeyFormatValues,
    key?: CryptoKey | undefined,
):Promise<any> {
    if (typeof key === 'undefined') {
        return Promise.reject(new Error(Errors.UNDEF_EXPORTED_KEY));
    }
    return Subtle.exportKey(format, key);
}

/** Converts keys in various formats into a CryptoKey object */
export function importCryptoKey(
    format: baseTypes.TValidKeyFormatValues,
    keyData: any,
    algorithm: baseTypes.IKeyGenAlgorithm | baseTypes.TKeyGenAlgorithmValidNameValues | undefined,
    extractable: boolean,
    usages: baseTypes.TKeyUsages | undefined = [],
):Promise<CryptoKey> {
    if (typeof algorithm === 'undefined') {
        return Promise.reject(new Error(Errors.UNDEF_KEY_IMPORT_ALGORITHM));
    }
    return Subtle.importKey(format, keyData, algorithm, extractable, usages);
}

/** Basic cryptographic key class, extended by other, more specific classes */
export class BaseKey {
    private _keyParams: baseTypes.IKeyParams;

    private _cryptoKey?: CryptoKey;

    private _jwk?: baseTypes.IJwk;

    protected _clearBase(): void {
        this._cryptoKey = undefined;
        this._jwk = undefined;
    }

    protected _clear(): void {
        this._clearBase();
    }

    constructor(passedKeyParams: baseTypes.IKeyParams = EmptyKeyParams) {
        if (typeof passedKeyParams.genAlgorithm === 'undefined') {
            throw new Error(Errors.UNDEF_KEY_GEN_ALGORITHM);
        }
        if (typeof passedKeyParams.usages === 'undefined') {
            throw new Error(Errors.UNDEF_KEY_USAGES);
        }
        this._keyParams = { ...passedKeyParams };
    }

    /**
     * Key type.
     */
    public get type(): baseTypes.TValidKeyType {
        return this._keyParams.type;
    }

    /**
     * Key type.
     */
    public set type(type: baseTypes.TValidKeyType) {
        this._keyParams.type = type;
    }

    /**
     * A string, identifying set of parameters for this key.
     */
    public get paramsId(): string {
        return this._keyParams.paramsId;
    }

    /**
     * Object, containing set of parameters for this key
     */
    public get keyParams(): baseTypes.IKeyParams {
        return this._keyParams;
    }

    /**
     * can be used to set key parameters after class creation
     * useful with conditional statements in derived classes ctors
     * (see RSAKey)
     */
    public set keyParams(params: baseTypes.IKeyParams) {
        if (this.keyParams.paramsId === EmptyKeyParams.paramsId) {
            this._keyParams = { ...params };
        } else {
            throw new Error(Errors.KEY_PARAMS_REDEFINITION);
        }
    }

    /**
     * Set key value from a JWK object
     * @param jwk - JWK object from which to take key value
     * @param doClear - set to false (true by default) to not to clean already set key values
     */
    public setJWK(jwk: baseTypes.IJwk, doClear: boolean = true): void {
        if (doClear) {
            this._clear();
        }
        this._jwk = correctJwkFields(jwk, this._keyParams.usages!, true);
    }

    /**
     * Get a JWK object, which can be used with setJWK() method
     * @returns - JWK object, containing key value
     */
    public getJWK(): Promise<baseTypes.IJwk> {
        return new Promise((resolve, reject) => {
            if (typeof this._jwk === 'undefined') {
                if (typeof this._cryptoKey === 'undefined') {
                    return reject(new Error(Errors.NO_BASE_KEY_VALUE));
                }
                exportCryptoKey('jwk', this._cryptoKey)
                    .then((exportedJwk: baseTypes.IJwk) => {
                        this.setJWK(exportedJwk, false);
                        return resolve({ ...this._jwk! });
                    })
                    .catch((error: any) => { return reject(error); });
            } else {
                return resolve({ ...this._jwk });
            }
        });
    }

    /**
     * Sets the key value from a standard CryptoKey object, used by SubtleCrypto
     * @param cryptoKey - CryptoKey object
     * @param doClear - set to false (true by default) to not to clean already set key values
     */
    public setCryptoKey(cryptoKey: CryptoKey, doClear: boolean = true): void {
        if (this.keyParams.paramsId === '') {
            throw new Error(Errors.KEY_PARAMS_NOT_SET);
        }
        if (cryptoKey.algorithm.name !== this._keyParams.genAlgorithm!.name) {
            throw new Error(Errors.IMPORT_ALG_ERROR);
        }
        if (cryptoKey.type !== this.type) {
            throw new Error(Errors.IMPORT_TYPE_ERROR);
        }
        if (!similarArrays(this._keyParams.usages!, cryptoKey.usages)) {
            throw new Error(Errors.IMPORT_USAGES_ERROR);
        }
        if (doClear) {
            this._clear();
        }
        this._cryptoKey = cryptoKey;
    }

    /**
     * Get a CCryptoKey object, which can be used with setCryptoKey() method
     * @returns - CryptoKey object, containing key value
     */
    public getCryptoKey(): Promise<CryptoKey> {
        return new Promise((resolve, reject) => {
            if (typeof this._cryptoKey === 'undefined') {
                if (typeof this._jwk === 'undefined') {
                    return reject(new Error(Errors.NO_BASE_KEY_VALUE));
                }
                importCryptoKey('jwk', this._jwk, this._keyParams.genAlgorithm, true, this._keyParams.usages)
                    .then((importedCryptoKey: CryptoKey) => {
                        this.setCryptoKey(importedCryptoKey, false);
                        return resolve(this._cryptoKey!);
                    })
                    .catch((error: any) => { return reject(error); });
            } else {
                return resolve(this._cryptoKey);
            }
        });
    }
}

/**
 * Signs arbitrary data using a suitable cryptographic key
 * @param key - cryptographic key
 * @param data - data to sign
 * @param hashAlgorithm - hash algorithm to use during signing process
 * @returns - signature for given data
 */
export function signData(
    key: BaseKey,
    data: Uint8Array,
    hashAlgorithm?: baseTypes.TKeyGenAlgorithmValidHashValues,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        if (!hashAlgorithm && !key.keyParams.genAlgorithm!.hash) {
            return reject(new Error(Errors.UNSURE_HASH_TYPE));
        }
        key.getCryptoKey()
            .then((cryptoKey: CryptoKey) => {
                Subtle.sign(
                    {
                        name: key.keyParams.genAlgorithm!.name,
                        hash: hashAlgorithm || key.keyParams.genAlgorithm!.hash,
                    },
                    cryptoKey,
                    data.buffer,
                ).then((signature: ArrayBuffer) => {
                    return resolve(new Uint8Array(signature));
                }).catch((error: any) => {
                    return reject(error);
                });
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Verifies the correctness of a signature on arbitrary data, using a suitable cryptographic key.
 * @param key - cryptographic key
 * @param data - source data, which have been cpassed to signData() method
 * @param signature - signature, produced by signData() method
 * @param hashAlgorithm - hash algorithm used during signing process
 * @returns - true if signature is valid and data haven't been modified. False otherwise.
 */
export function verifyDataSignature(
    key: BaseKey,
    data: Uint8Array,
    signature: Uint8Array,
    hashAlgorithm?: baseTypes.TKeyGenAlgorithmValidHashValues,
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (!hashAlgorithm && !key.keyParams.genAlgorithm!.hash) {
            return reject(new Error(Errors.UNSURE_HASH_TYPE));
        }
        key.getCryptoKey()
            .then((cryptoKey: CryptoKey) => {
                Subtle.verify(
                    {
                        name: key.keyParams.genAlgorithm!.name,
                        hash: hashAlgorithm || key.keyParams.genAlgorithm!.hash,
                    },
                    cryptoKey,
                    signature.buffer,
                    data.buffer,
                ).then((result: boolean) => {
                    return resolve(result);
                }).catch((error: any) => {
                    return reject(error);
                });
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Generic encrypt function.
 * @param params - Encryption params object.
 * @param key - Cryptographic key.
 * @param plainData - Data to encrypt.
 * @returns - Encrypted data.
 */
export function encrypt(
    params: baseTypes.ITranscryptParams,
    key: BaseKey,
    plainData: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        key.getCryptoKey()
            .then((cryptoKey: CryptoKey) => {
                Subtle.encrypt(params, cryptoKey, plainData)
                    .then((encryptedData: ArrayBuffer) => {
                        return resolve(new Uint8Array(encryptedData));
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
 * Generic decryption function
 * @param params - Decryption params object.
 * @param key - Decryption key.
 * @param encryptedData - Data to decrypt.
 * @returns - Plain decrypted data.
 */
export function decrypt(
    params: baseTypes.ITranscryptParams,
    key: BaseKey,
    encryptedData: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        key.getCryptoKey()
            .then((cryptoKey: CryptoKey) => {
                Subtle.decrypt(params, cryptoKey, encryptedData)
                    .then((plainData: ArrayBuffer) => {
                        return resolve(new Uint8Array(plainData));
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
 * Basic cryptographic key pair interface.
 */
export interface IBaseKeyPair {
    keyPairParams: baseTypes.IKeyPairParams;
    publicKey: BaseKey;
    privateKey: BaseKey;
}
