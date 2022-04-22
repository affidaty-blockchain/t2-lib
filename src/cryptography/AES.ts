import * as Errors from '../errors';
import { WebCrypto, Subtle } from './webCrypto';
import { IKeyParams } from './baseTypes';
import { importCryptoKey, BaseKey } from './base';
import {
    AESGCM256KeyParams as defaultAesParams,
    DEF_AES_IV_BYTE_LEN as ivLength,
    DEF_AES_SALT_BYTE_LEN as saltLength,
} from './cryptoDefaults';

interface ISaltAndIV {
    salt: Uint8Array;
    iv: Uint8Array;
}

export function getSaltAndIV(
    data: Uint8Array,
    saltLen: number = saltLength,
    ivLen: number = ivLength,
): ISaltAndIV {
    const salt = data.slice(0, saltLen);
    const iv = data.slice(saltLength, saltLength + ivLen);
    return {
        salt,
        iv,
    };
}

/* AES Password ENCRYPTION / DECRYPTION METHODS */
/* based on: https://bradyjoslin.com/blog/encryption-webcrypto/  */
function PasswordToPBKDF2(password: string): Promise<CryptoKey> {
    return new Promise((resolve, reject) => {
        importCryptoKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveKey', 'deriveBits'],
        )
            .then((pwdKey: CryptoKey) => {
                return resolve(pwdKey);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

function PBKDF2ToAES(pbkdf2: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
    return new Promise((resolve, reject) => {
        Subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 250000,
                hash: 'SHA-256',
            },
            pbkdf2,
            defaultAesParams.genAlgorithm,
            false,
            defaultAesParams.usages,
        )
            .then((aesCryptoKey: CryptoKey) => {
                return resolve(aesCryptoKey);
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Encrypts data with password using AES cryptography
 * @param password - String to use as encryption key.
 * @param plainData - Binary data to encrypt.
 * @param customInitVector - Custom initialization vector
 * (gets generatet is not provided, DO NOT USE SAME VALUE TWICE!).
 * @param customSalt - Custom salt value. Gets generated if not provided.
 */

export function AESPassEncrypt(
    password: string,
    plainData: Uint8Array,
    customInitVector?: Uint8Array,
    customSalt?: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        if (typeof customInitVector !== 'undefined' && customInitVector.byteLength !== ivLength) {
            return reject(new Error(Errors.IV_LEN));
        }
        if (typeof customSalt !== 'undefined' && customSalt.byteLength !== saltLength) {
            return reject(new Error(Errors.SALT_LEN));
        }
        const iv = customInitVector || WebCrypto.getRandomValues(new Uint8Array(12));
        const salt = customSalt || WebCrypto.getRandomValues(new Uint8Array(16));
        PasswordToPBKDF2(password)
            .then((pbkdf2: CryptoKey) => {
                PBKDF2ToAES(pbkdf2, salt)
                    .then((aesKey: CryptoKey) => {
                        Subtle.encrypt(
                            {
                                name: aesKey.algorithm.name,
                                iv,
                            },
                            aesKey,
                            plainData,
                        )
                            .then((encryptedData: ArrayBuffer) => {
                                const result = new Uint8Array(
                                    salt.byteLength
                                    + iv.byteLength
                                    + encryptedData.byteLength,
                                );
                                result.set(salt, 0);
                                result.set(iv, salt.byteLength);
                                result.set(
                                    new Uint8Array(encryptedData),
                                    salt.byteLength + iv.byteLength,
                                );
                                return resolve(result);
                            })
                            .catch((error: any) => {
                                return reject(error);
                            });
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
 * Decrypts data encrypted with AESPassEncrypt.
 * @param password - String to use as decryption key.
 * @param encryptedData - Binary data to decrypt.
 */
export function AESPassDecrypt(
    password: string,
    encryptedData: Uint8Array,
): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        if (encryptedData.byteLength <= (ivLength + saltLength)) {
            return reject(new Error(Errors.DATA_LEN));
        }
        const salt = encryptedData.slice(0, saltLength);
        const iv = encryptedData.slice(saltLength, saltLength + ivLength);
        const data = encryptedData.slice(saltLength + ivLength);
        PasswordToPBKDF2(password)
            .then((pbkdf2: CryptoKey) => {
                PBKDF2ToAES(pbkdf2, salt)
                    .then((aesKey: CryptoKey) => {
                        Subtle.decrypt(
                            {
                                name: aesKey.algorithm.name,
                                iv,
                            },
                            aesKey,
                            data,
                        )
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
            })
            .catch((error: any) => {
                return reject(error);
            });
    });
}

/**
 * Basic elliptic curve key class, extended by other, more specific classes
 */
export class AESKey extends BaseKey {
    private _raw: Uint8Array = new Uint8Array(0);

    constructor(keyPairParams: IKeyParams = defaultAesParams) {
        super(keyPairParams);
    }

    protected _clear(): void {
        this._raw = new Uint8Array(0);
        this._clearBase();
    }

    public generate(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._clear();
            Subtle.generateKey(
                this.keyParams.genAlgorithm,
                true,
                this.keyParams.usages,
            )
                .then((generatedCryptoKey: CryptoKey) => {
                    this.setCryptoKey(generatedCryptoKey);
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sets key value from raw bytes (public key)
     * @param raw - raw key bytes
     */
    public setRaw(
        raw: Uint8Array,
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            Subtle.importKey(
                'raw',
                raw,
                this.keyParams.genAlgorithm,
                true,
                this.keyParams.usages,
            )
                .then((importedCryptoKey: CryptoKey) => {
                    try {
                        this.setCryptoKey(importedCryptoKey);
                    } catch (error) {
                        return reject(error);
                    }
                    return resolve(true);
                })
                .catch((err: any) => {
                    return reject(err);
                });
        });
    }

    /**
     * Outputs key value as raw bytes (public key)
     * @returns - raw key bytes
     */
    public getRaw(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            if (this._raw.length > 0) {
                return resolve(this._raw);
            }
            this.getCryptoKey()
                .then((cryptoKey: CryptoKey) => {
                    Subtle.exportKey('raw', cryptoKey)
                        .then((rawKeyBytes: ArrayBuffer) => {
                            this._raw = new Uint8Array(rawKeyBytes);
                            return resolve(this._raw);
                        })
                        .catch((err: any) => {
                            return reject(err);
                        });
                })
                .catch((err: any) => {
                    return reject(err);
                });
        });
    }
}
