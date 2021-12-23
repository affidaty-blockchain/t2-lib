import { Subtle } from './cryptography/webCrypto';
import { arrayBufferToBase58 } from './binConversions';
import { IKeyPairParams } from './cryptography/baseTypes';
import {
    ECDSAP384R1KeyPairParams as defaultKeyPairParams,
    EKeyParamsIds,
    mKeyPairParams,
} from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import { BaseECKeyPair } from './cryptography/baseECKeyPair';

const PROTOBUF_HEADER = new Uint8Array([
    0x08, 0x03, // Algorythm type identifier (ECDSA)
    0x12, 0x78, // Content length
]);

const ASN1_HEADER = new Uint8Array([
    0x30, 0x76, // byte count
    0x30, 0x10, // byte len
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // EC Public key OID
    0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22, // secp384r1 curve OID
    0x03, 0x62, 0x00, // bitstring (bytes count)
]);

const MULTIHASH_HEADER = new Uint8Array([
    0x12, // hash algorithm identifier (SHA256)
    0x20, // hash length  (32)
]);

/**
 * Calculates Account ID from public key
 * @param input - public key or a custom string to derive accountId from
 * @returns - account ID
 */
export function getAccountId(input: BaseECKey): Promise<string> {
    return new Promise((resolve, reject) => {
        input.getRaw()
            .then((keyBytes: Uint8Array) => {
                const PROTO_KEY = new Uint8Array(
                    PROTOBUF_HEADER.byteLength
                    + ASN1_HEADER.byteLength
                    + keyBytes.byteLength,
                );
                PROTO_KEY.set(PROTOBUF_HEADER, 0);
                PROTO_KEY.set(ASN1_HEADER, PROTOBUF_HEADER.byteLength);
                PROTO_KEY.set(keyBytes, PROTOBUF_HEADER.byteLength + ASN1_HEADER.byteLength);

                Subtle.digest('SHA-256', PROTO_KEY)
                    .then((hashed: ArrayBuffer) => {
                        const hashBytes = new Uint8Array(hashed);
                        const accountId = new Uint8Array(
                            MULTIHASH_HEADER.byteLength
                            + hashBytes.byteLength,
                        );
                        accountId.set(MULTIHASH_HEADER, 0);
                        accountId.set(hashBytes, MULTIHASH_HEADER.byteLength);

                        // return base58
                        return resolve(arrayBufferToBase58(accountId.buffer));
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
 * Main TRINCI 2 Account class, providing import export and generation functionality.
 */
export class Account {
    private _accountId: string = '';

    private _keyPair: BaseECKeyPair = new BaseECKeyPair(defaultKeyPairParams);;

    private _clear(): void {
        this._accountId = '';
        this._keyPair = new BaseECKeyPair(this._keyPair!.keyPairParams);
    }

    constructor(keyPairParams?: IKeyPairParams) {
        if (typeof keyPairParams === 'undefined') {
            return;
        }
        this._keyPair = new BaseECKeyPair(keyPairParams!);
    }

    /** Account ID */
    public get accountId(): string {
        return this._accountId;
    }

    /** Account ID */
    public set accountId(id: string) {
        this._accountId = id;
    }

    /** Account key pair */
    public get keyPair(): BaseECKeyPair {
        return this._keyPair;
    }

    /** Sets key pair for the account */
    public setKeyPair(keyPair: BaseECKeyPair): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._clear();
            getAccountId(keyPair.publicKey)
                .then((accountId: string) => {
                    this._accountId = accountId;
                    this._keyPair = keyPair;
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sets account's public key (and, automatically, account ID)
     * Private key remains unchanged.
     * @param publicKey - account's public key
     * @param clearPrivate - if true, clears private key
     * @returns
     */
    public setPublicKey(publicKey: BaseECKey, clearPrivate: boolean = false): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (clearPrivate) {
                this._clear();
                this._keyPair.privateKey = new BaseECKey(
                    mKeyPairParams.get(EKeyParamsIds.EMPTY)!.privateKey,
                );
            }
            this._keyPair.publicKey = publicKey;
            this.keyPair.keyPairParams = mKeyPairParams.get(publicKey.paramsId)!;
            getAccountId(this._keyPair.publicKey)
                .then((accountId: string) => {
                    this._accountId = accountId;
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sets private key. As public key can be derived from private, this method effectively sets
     * the whole account (privatekey, public key and account ID)
     * @param privateKey - Private ECDSA key
     * @returns
     */
    public setPrivateKey(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._clear();
            this._keyPair.privateKey = privateKey;
            this._keyPair.privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this.setPublicKey(publicKey, false)
                        .then((result: boolean) => {
                            resolve(result);
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

    /** Generates a new account with a new key pair from scratch. */
    public generate(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._keyPair.generate()
                .then(() => {
                    getAccountId(this._keyPair.publicKey)
                        .then((accountId: string) => {
                            this._accountId = accountId;
                            return resolve(true);
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
