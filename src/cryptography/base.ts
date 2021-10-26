import { Key as UtilKey } from 'js-crypto-key-utils';
import * as Errors from '../errors';
import { Subtle } from './webCrypto';
import { similarArrays } from '../utils';
import { EmptyKeyParams } from './cryptoDefaults';

export type TValidKeyType = 'public' | 'private' | 'secret' |'undefined';
export type TValidKeyFormatValues = 'jwk' | 'raw';
export type TValidKeyUsageValues = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'deriveKey' | 'deriveBits' | 'wrapKey' | 'unwrapKey';
export type TKeyUsages = TValidKeyUsageValues[];
export type TTranscryptAlgorithmValidName = 'RSA-OAEP' | 'AES-GCM';
export type TKeyGenAlgorithmValidNameValues = '' | 'ECDSA' | 'ECDH' | 'RSA-OAEP' | 'AES-GCM' | 'HMAC' | 'PBKDF2';
export type TKeyGenAlgorithmValidNamedCurveValues = 'P-384';
export type TKeyGenAlgorithmValidModulusLengthValues = 2048 | 3072 | 4096;
export type TKeyGenAlgorithmValidPublicExponentValues = Uint8Array;
export type TKeyGenAlgorithmValidHashValues = 'SHA-256' | 'SHA-384' | 'SHA-512';
export type TValidSymmetricKeyLength = 256;
type TecKeyBinFormat = 'oct' | 'der' | 'pem';

interface IRsaOtherPrimesInfo {
    d?: string;
    r?: string;
    t?: string;
}

/** JWK Interface */
export interface IJwk {
    key_ops?: TKeyUsages,
    ext?: boolean;
    kty: string;
    crv?: string;
    alg?: string;
    d?: string;
    x?: string;
    y?: string;
    k?: string;
    dp?: string;
    dq?: string;
    e?: string;
    n?: string;
    oth?: IRsaOtherPrimesInfo[];
    p?: string;
    q?: string;
    qi?: string;
    use?: string;
}

/**
* Interface to define key generation algorithm params.
* Used in IKeyParams interface and for key derivation.
*/
export interface IKeyGenAlgorithm {
    name: TKeyGenAlgorithmValidNameValues, // all
    namedCurve?: TKeyGenAlgorithmValidNamedCurveValues, // EC
    modulusLength?: TKeyGenAlgorithmValidModulusLengthValues, // RSA
    publicExponent?: TKeyGenAlgorithmValidPublicExponentValues, // RSA
    hash?: TKeyGenAlgorithmValidHashValues, // RSA, HMAC
    length?: TValidSymmetricKeyLength, // AES
}

/**
* Interface that defines cryptographic key params.
*/
export interface IKeyParams {
    /** String identifying this particulas set of parameters */
    paramsId: string;
    genAlgorithm?: IKeyGenAlgorithm;
    /** array of key usages */
    usages?: TKeyUsages;
    type: TValidKeyType;
}

/** Interface defining parameters for a keypair generation */
export interface IKeyPairParams {
    publicKey: IKeyParams;
    privateKey: IKeyParams;
    /** Union of publicKey and privateKey usages */
    usages: TKeyUsages;
}

export interface ITranscryptParams {
    name: TTranscryptAlgorithmValidName;
    iv?: Uint8Array;
}

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
): Promise<IJwk> {
    return new Promise((resolve, reject) => {
        if (bin.byteLength === 0) {
            return reject(new Error(Errors.EMPTY_VALUE));
        }
        const keyObj = new UtilKey(binFormat, bin, importOptions);
        keyObj.export('jwk', exportOptions)
            .then((exportedJwk:any) => {
                const result: IJwk = exportedJwk;
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
    jwk: IJwk,
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
function correctJwkFields(jwk: IJwk, jwkOps: TKeyUsages, jwkExt: boolean): IJwk {
    const tempJwk: IJwk = { ...jwk };
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
    format: TValidKeyFormatValues,
    key?: CryptoKey | undefined,
):Promise<any> {
    if (typeof key === 'undefined') {
        return Promise.reject(new Error(Errors.UNDEF_EXPORTED_KEY));
    }
    return Subtle.exportKey(format, key);
}

/** Converts keys in various formats into a CryptoKey object */
export function importCryptoKey(
    format: TValidKeyFormatValues,
    keyData: any,
    algorithm: IKeyGenAlgorithm | TKeyGenAlgorithmValidNameValues | undefined,
    extractable: boolean,
    usages: TKeyUsages | undefined = [],
):Promise<CryptoKey> {
    if (typeof algorithm === 'undefined') {
        return Promise.reject(new Error(Errors.UNDEF_KEY_IMPORT_ALGORITHM));
    }
    return Subtle.importKey(format, keyData, algorithm, extractable, usages);
}

/** Basic cryptographic key class, extended by other, more specific classes */
export class BaseKey {
    private _keyParams: IKeyParams;

    private _cryptoKey?: CryptoKey;

    private _jwk?: IJwk;

    protected _clearBase(): void {
        this._cryptoKey = undefined;
        this._jwk = undefined;
    }

    protected _clear(): void {
        this._clearBase();
    }

    constructor(passedKeyParams: IKeyParams = EmptyKeyParams) {
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
    public get type():TValidKeyType {
        return this._keyParams.type;
    }

    /**
     * Key type.
     */
    public set type(type: TValidKeyType) {
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
    public get keyParams(): IKeyParams {
        return this._keyParams;
    }

    /**
     * can be used to set key parameters after class creation
     * useful with conditional statements in derived classes ctors
     * (see RSAKey)
     */
    public set keyParams(params: IKeyParams) {
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
    public setJWK(jwk: IJwk, doClear: boolean = true): void {
        if (doClear) {
            this._clear();
        }
        this._jwk = correctJwkFields(jwk, this._keyParams.usages!, true);
    }

    /**
     * Get a JWK object, which can be used with setJWK() method
     * @returns - JWK object, containing key value
     */
    public getJWK(): Promise<IJwk> {
        return new Promise((resolve, reject) => {
            if (typeof this._jwk === 'undefined') {
                if (typeof this._cryptoKey === 'undefined') {
                    return reject(new Error(Errors.NO_BASE_KEY_VALUE));
                }
                exportCryptoKey('jwk', this._cryptoKey)
                    .then((exportedJwk: IJwk) => {
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
    hashAlgorithm: string,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        key.getCryptoKey()
            .then((cryptoKey: CryptoKey) => {
                Subtle.sign(
                    {
                        name: key.keyParams.genAlgorithm!.name,
                        hash: hashAlgorithm,
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
    hashAlgorithm: string,
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        key.getCryptoKey()
            .then((cryptoKey: CryptoKey) => {
                Subtle.verify(
                    {
                        name: key.keyParams.genAlgorithm!.name,
                        hash: hashAlgorithm,
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
    params: ITranscryptParams,
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
    params: ITranscryptParams,
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
    keyPairParams: IKeyPairParams;
    publicKey: BaseKey;
    privateKey: BaseKey;
}
