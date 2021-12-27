import { arrayBufferToBase58, base58ToArrayBuffer } from './binConversions';
import { objectToBytes, bytesToObject } from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/baseTypes';
import { signData, verifyDataSignature } from './cryptography/base';
import { DEF_SIGN_HASH_ALGORITHM as defaultSignHash } from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';

/**
 * Structure returned by Signable.toObject() method.
 */
export interface ISignableObject {
    type: string;
    data: any;
    signature?: Uint8Array;
}

// exported for usage in Client class
export interface ISignableObjectWithBuffer {
    type: string;
    data: any;
    signature?: Buffer;
}

export interface ISignableUnnamedObject extends Array<any> {
    [0]: string;
    [1]: any,
    [2]?: Buffer;
}

export interface ISignableUnnamedObjectNoTag extends Array<any> {
    [0]: any,
    [1]?: Buffer;
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class Signable {
    protected _typeTag: string = '';

    protected _data: any = {};

    protected _signature: Buffer = Buffer.from([]);

    protected _signHashAlg: TKeyGenAlgorithmValidHashValues;

    constructor(hash: TKeyGenAlgorithmValidHashValues = defaultSignHash) {
        this._signHashAlg = hash;
    }

    public get typeTag(): string {
        return this._typeTag;
    }

    public set typeTag(typeTag: string) {
        this._typeTag = typeTag;
    }

    /** Data to sign */
    public get data(): any {
        return this._data;
    }

    /** Data to sign */
    public set data(newData: any) {
        this._data = newData;
    }

    /** Data signature */
    public get signature(): Uint8Array {
        return new Uint8Array(this._signature);
    }

    /** Data signature */
    public set signature(signature: Uint8Array) {
        this._signature = Buffer.from(signature);
    }

    protected toUnnamedObject(): Promise<ISignableUnnamedObject> {
        return new Promise((resolve) => {
            const resultObj: ISignableUnnamedObject = [
                this._typeTag,
                this._data,
            ];
            if (this._signature.byteLength > 0) {
                resultObj[2] = this._signature;
            }
            return resolve(resultObj);
        });
    }

    protected toUnnamedObjectNoTag(): Promise<ISignableUnnamedObjectNoTag> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: ISignableUnnamedObject) => {
                    const resultObj: ISignableUnnamedObjectNoTag = [
                        unnamedObj[1],
                    ];
                    if (unnamedObj[2]) {
                        resultObj[1] = unnamedObj[2];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    protected toObjectWithBuffers(): Promise<ISignableObjectWithBuffer> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: ISignableUnnamedObject) => {
                    const resultObj: ISignableObjectWithBuffer = {
                        type: unnamedObj[0],
                        data: unnamedObj[1],
                    };
                    if (unnamedObj[2]) {
                        resultObj.signature = unnamedObj[2];
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Serializes signable to a simple object with named properties
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<ISignableObject> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((withBuffers: ISignableObjectWithBuffer) => {
                    const resultObj: ISignableObject = {
                        type: withBuffers.type,
                        data: withBuffers.data,
                    };
                    if (withBuffers.signature) {
                        resultObj.signature = new Uint8Array(withBuffers.signature);
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Serializes signable object to a Uint8Array
     * @returns - Uint8Array, throws otherwise
     */
    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: ISignableUnnamedObject) => {
                    return resolve(objectToBytes(unnamedObj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Serializes signable object to a base58 string
     * @returns - b58 string, throws otherwise
     */
    public toBase58(): Promise<string> {
        return new Promise((resolve, reject) => {
            this.toBytes()
                .then((bytes: Uint8Array) => {
                    return resolve(arrayBufferToBase58(bytes.buffer));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    protected fromUnnamedObject(passedObj: ISignableUnnamedObject): Promise<boolean> {
        return new Promise((resolve) => {
            this._typeTag = passedObj[0];
            this._data = passedObj[1];
            if (passedObj[2]) {
                this._signature = passedObj[2];
            }
            return resolve(true);
        });
    }

    protected fromUnnamedObjectNoTag(passedObj: ISignableUnnamedObjectNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: ISignableUnnamedObject = [
                '',
                passedObj[0],
            ];
            if (passedObj[1]) {
                unnamedArg[2] = passedObj[1];
            }
            this.fromUnnamedObject(unnamedArg)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
            return resolve(true);
        });
    }

    protected fromObjectWithBuffers(passedObj: ISignableObjectWithBuffer): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: ISignableUnnamedObject = [
                passedObj.type,
                passedObj.data,
            ];
            if (passedObj.signature) {
                unnamedArg[2] = passedObj.signature;
            }
            this.fromUnnamedObject(unnamedArg)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Tries to deserialize a signable from object with named properties.
     * @param object - object to try to deserialize signable from
     * @returns - true on success, throws otherwise
     */
    public fromObject(object: ISignableObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const withBuffersArg: ISignableObjectWithBuffer = {
                type: object.type,
                data: object.data,
            };
            if (object.signature) {
                withBuffersArg.signature = Buffer.from(object.signature);
            }
            this.fromObjectWithBuffers(withBuffersArg)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Tries to deserialize a signable from a Uint8Array.
     * @param bytes - base58 string to try to deserialize signable from
     * @returns - true on success, throws otherwise
     */
    public fromBytes(bytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObj: ISignableUnnamedObject = bytesToObject(bytes);
            this.fromUnnamedObject(unnamedObj)
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Tries to deserialize a signable from a base58 string.
     * @param b58 - base58 string to try to deserialize signable from
     * @returns - true on success, throws otherwise
     */
    public fromBase58(b58: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.fromBytes(new Uint8Array(base58ToArrayBuffer(b58)))
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Sign data with private key
     * @param privateKey - private key to sign data with
     * @returns - true if signed, throws otherwise
     */
    public sign(privateKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ISignableUnnamedObject) => {
                    const bytesToSign: Uint8Array = objectToBytes(unnamedObject[1]);
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

    /**
     * Verifies data signature against a public key
     * @param publicKey - Public key to verify signature against
     * @returns - true if signature is valid, false otherwise. Can throw.
     */
    public verifySignature(publicKey: BaseECKey): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ISignableUnnamedObject) => {
                    const dataToVerify: Uint8Array = objectToBytes(unnamedObject[1]);
                    // console.log(Buffer.from(dataToVerify).toString('hex'));
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
