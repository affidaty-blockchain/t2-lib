import { arrayBufferToBase58, base58ToArrayBuffer } from './binConversions';
import { objectToBytes, bytesToObject } from './utils';
import { signData, verifyDataSignature, TKeyGenAlgorithmValidHashValues } from './cryptography/base';
import { DEF_SIGN_HASH_ALGORITHM as defaultSignHash } from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';

export const SIGN_HASH_ALGORITHM = 'SHA-384';

/**
 * Structure returned by Signable.toObject() method.
 */
export interface ISignableObject {
    data: any,
    signature: Uint8Array;
}

// exported for usage in Client class
export interface ISignableObjectWithBuffer {
    data: any,
    signature: Buffer;
}

export interface ISignableUnnamedObject extends Array<any> {
    [0]: any,
    [1]: Buffer;
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class Signable {
    protected _data: any = {};

    protected _signature: Buffer = Buffer.from([]);

    protected _signHashAlg: TKeyGenAlgorithmValidHashValues;

    constructor(hash: TKeyGenAlgorithmValidHashValues = defaultSignHash) {
        this._signHashAlg = hash;
    }

    public get data(): any {
        return this._data;
    }

    public set data(newData: any) {
        this._data = newData;
    }

    public get signature(): Uint8Array {
        return new Uint8Array(this._signature);
    }

    public set signature(signature: Uint8Array) {
        this._signature = Buffer.from(signature);
    }

    protected toObjectWithBuffers(): Promise<ISignableObjectWithBuffer> {
        return new Promise((resolve) => {
            const resultObj: ISignableObjectWithBuffer = {
                data: this._data,
                signature: this._signature,
            };
            return resolve(resultObj);
        });
    }

    protected fromObjectWithBuffers(passedObj: ISignableObjectWithBuffer): Promise<boolean> {
        return new Promise((resolve) => {
            this._data = passedObj.data;
            this._signature = passedObj.signature;
            return resolve(true);
        });
    }

    protected fromUnnamedObject(passedObj: ISignableUnnamedObject): Promise<boolean> {
        return new Promise((resolve) => {
            this._data = passedObj[0];
            this._signature = passedObj[1];
            return resolve(true);
        });
    }

    protected toUnnamedObject(): Promise<ISignableUnnamedObject> {
        return new Promise((resolve) => {
            const resultObj: ISignableUnnamedObject = [
                this._data,
                this._signature,
            ];
            return resolve(resultObj);
        });
    }

    /** Exports signable as an easy-to-use javascript object.
     * Importable with fromObject() method.
    */
    public toObject(): Promise<ISignableObject> {
        return new Promise((resolve) => {
            const resultObj: ISignableObject = {
                data: this._data,
                signature: new Uint8Array(this._signature),
            };
            return resolve(resultObj);
        });
    }

    /** Imports signable from a plain javascript object.
     * Exportable with toObject() method */
    public fromObject(passedObj: ISignableObject): Promise<boolean> {
        return new Promise((resolve) => {
            this._data = passedObj.data;
            this._signature = Buffer.from(passedObj.signature);
            return resolve(true);
        });
    }

    /** Serializes signable as a base58 string javascript object.
     * Importable with fromBase58() method.
    */
    public toBase58(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toBytes()
                .then((bytes: Uint8Array) => {
                    return resolve(arrayBufferToBase58(bytes));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Deserializes signable from a base58 string,
     * obtained from toBase58() method */
    public fromBase58(b58: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromBytes(new Uint8Array(base58ToArrayBuffer(b58)))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Exports signable as ready to send bytes.
     * Importable by fromBytes() method.
    */
    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objWithBuffers: ISignableObjectWithBuffer) => {
                    return resolve(objectToBytes(objWithBuffers));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Imports signable from bytes serialized
     * with toBytes() method */
    public fromBytes(passedBytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objWithBuffers: ISignableObjectWithBuffer = bytesToObject(passedBytes);
            this.fromObjectWithBuffers(objWithBuffers)
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Signs transaction with private key, provided by
     * the gived key pair. This also automativcally sets
     * signerPublicKey of this transaction
     */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ISignableUnnamedObject) => {
                    const bytesToSign: Uint8Array = objectToBytes(unnamedObject[0]);
                    signData(privateKey, bytesToSign, this._signHashAlg)
                        .then((signature: Uint8Array) => {
                            this._signature = Buffer.from(signature);
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

    /** Verifies if transaction has a valid signature produced
     * by the private key associated with signerPublicKey
     */
    public verifySignature(publicKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ISignableUnnamedObject) => {
                    const dataToVerify: Uint8Array = objectToBytes(unnamedObject[0]);
                    verifyDataSignature(
                        publicKey,
                        dataToVerify,
                        new Uint8Array(this._signature),
                        this._signHashAlg,
                    )
                        .then((result: boolean) => {
                            return resolve(result);
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
