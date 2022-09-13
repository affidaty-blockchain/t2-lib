import { Key as UtilKey } from 'js-crypto-key-utils';
import { modPow } from '../bigIntModArith';
import * as baseTypes from './baseTypes';
import * as Errors from '../errors';
import { Subtle } from './webCrypto';
import {
    similarArrays,
    padStrWithZeroes,
    concatBytes,
} from '../utils';
import {
    EmptyKeyParams,
    DEF_SIGN_HASH_ALGORITHM,
} from './cryptoDefaults';

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
    hashAlgorithm: baseTypes.TKeyGenAlgorithmValidHashValues = DEF_SIGN_HASH_ALGORITHM,
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
    hashAlgorithm: baseTypes.TKeyGenAlgorithmValidHashValues = DEF_SIGN_HASH_ALGORITHM,
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

export function compressRawCurvePoint(fullCurvePoint: Uint8Array | ArrayBufferLike): Uint8Array {
    const u8full = new Uint8Array(fullCurvePoint);
    const len = u8full.byteLength;
    /* eslint-disable no-bitwise */
    const u8 = u8full.slice(0, 1 + len >>> 1); // drop `y`
    u8[0] = 0x2 | (u8full[len - 1] & 0x01); // encode sign of `y` in first bit
    /* eslint-enable no-bitwise */
    return u8;
}

export function decompressRawCurvePoint(
    compPubKey: Uint8Array | ArrayBufferLike,
    curveName: string = 'secp384r1',
): Uint8Array {
    const u8CompPubKey = new Uint8Array(compPubKey);
    // isolating X bytes
    const x = BigInt(`0x${Buffer.from(u8CompPubKey.subarray(1)).toString('hex')}`);
    // getting Y parity value
    const signY = BigInt(u8CompPubKey[0] - 2);

    // setting const values for selected curve
    // TODO: implement the possibility to use other named NIST curves
    // curves const values: https://neuromancer.sk/std/nist
    let p = BigInt(0);
    let b = BigInt(0);
    let pIdent = BigInt(0);
    switch (curveName) {
        case 'secp384r1':
            p = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff');
            b = BigInt('0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef');
            pIdent = (p + BigInt(1)) / BigInt(4);
            break;
        default:
            throw new Error(Errors.DECOMPRESS_UNSUPPORTED_EC_NAME);
    }

    // solving equation
    let y = modPow(((x ** BigInt(3)) - (x * BigInt(3)) + b), pIdent, p);

    // determining which Y to use
    if ((y % BigInt(2)) !== signY) {
        y = p - y;
    }
    const fullCurvePointHex = `04${padStrWithZeroes(x.toString(16), 96)}${padStrWithZeroes(y.toString(16), 96)}`;
    return new Uint8Array(Buffer.from(fullCurvePointHex, 'hex'));
}

export function isCompressedCurvePoint(curvePoint: Uint8Array | ArrayBufferLike): boolean {
    const u8CurvePoint = new Uint8Array(curvePoint);
    return (
        u8CurvePoint.byteLength
        && (
            u8CurvePoint[0] === 0x02
            || u8CurvePoint[0] === 0x03
        )
    ) as boolean;
}

/**
 * Converts an IEEE P1363 signature into ASN.1/DER.
 *
 * @param string $p1363 Binary IEEE P1363 signature.
 */
export function ieeeP1363ToAsn1(p1363: ArrayBufferLike | Uint8Array): any {
    const _p1363 = new Uint8Array(p1363);
    let asn1 = new Uint8Array(0);

    // P1363 format: r followed by s.
    // ASN.1 format:
    // 0x30
    //  b1 0x02 b2 r 0x02 b3 s.
    //
    // r and s must be prefixed with 0x00 if their first byte is > 0x7f.
    //
    // b1 = length of contents.
    // b2 = length of r after being prefixed if necessary.
    // b3 = length of s after being prefixed if necessary.
    const cLen: number = Math.floor(_p1363.length / 2); // Length of each P1363 component.

    // Separate P1363 signature into its two equally sized components.
    // split signature into r and s components
    const sValues = [
        new Uint8Array(p1363.slice(0, cLen)),
        new Uint8Array(p1363.slice(cLen)),
    ];
    for (let i = 0; i < sValues.length; i += 1) {
        // 0x02 prefix before each component.
        let tmp = new Uint8Array([0x02]);
        if (sValues[i][0] > 0x7f) {
            // append length (+1 because 0x00 will also be added)
            tmp = new Uint8Array(concatBytes(tmp, new Uint8Array([cLen + 1])));
            // Add 0x00 because first byte of component > 0x7f.
            tmp = new Uint8Array(concatBytes(tmp, new Uint8Array([0x00])));
            // Add actual value.
            tmp = new Uint8Array(concatBytes(tmp, sValues[i]));
        } else {
            // just add length and actual value
            tmp = new Uint8Array(concatBytes(tmp, new Uint8Array([cLen])));
            tmp = new Uint8Array(concatBytes(tmp, sValues[i]));
        }
        asn1 = new Uint8Array(concatBytes(asn1, tmp));
    }
    // 0x30 b1, then contents
    asn1 = new Uint8Array(concatBytes(new Uint8Array([0x30, asn1.byteLength]), asn1));
    return asn1;
}

// currently not enabled
// function ASN1ToIEEEP1363(asn1: Uint8Array | ArrayBufferLike): ArrayBuffer {
//     const _asn1 = new Uint8Array(asn1);
//     const buffer = new ArrayBuffer(_asn1.length);
//     const int8View = new Int8Array(buffer);
//     for (let i = 0, strLen = _asn1.length; i < strLen; i += 1) {
//         int8View[i] = _asn1.charCodeAt(i);
//     }
//     //Currently these bytes getting for SHA256. for other hashings need to make it dynamic
//     const r = new Uint8Array(buffer.slice(4, 36));
//     const s = new Uint8Array(buffer.slice(39));
//     return appendBuffer(r, s);
// }
