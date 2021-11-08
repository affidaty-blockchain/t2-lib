import * as Errors from './errors';
import { WebCrypto } from './cryptography/webCrypto';
import { objectToBytes, bytesToObject } from './utils';
import { TKeyGenAlgorithmValidHashValues } from './cryptography/base';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
    EmptyKeyParams,
    EKeyParamsIds,
    mKeyPairParams,
} from './cryptography/cryptoDefaults';
import { BaseECKey } from './cryptography/baseECKey';
import {
    Signable,
    ISignableObject,
    ISignableObjectWithBuffer,
    ISignableUnnamedObject,
} from './signable';

interface ITxUnnamedPublicKeyObject extends Array<any> {
    [0]: string; // algorithm type. E.g. 'ecdsa'
    [1]: string; // curve type. E.g. 'secp384r1'
    [2]: Buffer; // actual value of the public key as 'raw'
}

export interface IUnnamedData extends Array<any> {
    /** Transaction schema reference */
    [0]: string;
    /** Target AccountId */
    [1]: string;
    /** Max fuel that consumable by this transaction */
    [2]: number;
    /** Nonce */
    [3]: Buffer;
    /** Network name */
    [4]: string;
    /** Smart contract hash */
    [5]: Buffer | null;
    /** Smart contract method */
    [6]: string;
    /** Signer's public key */
    [7]: ITxUnnamedPublicKeyObject;
    /** Msgpacked smart contract args */
    [8]: Buffer;
}

export interface ITxUnnamedObject extends ISignableUnnamedObject {
    [0]: IUnnamedData,
    [1]: Buffer;
}

interface ITxPublicKeyObjectWithBuffers {
    type: string; // algorithm type. E.g. 'ecdsa'
    curve: string; // curve type. E.g. 'secp384r1'
    value: Buffer; // actual value of the public key as 'raw'
}

// exported for usage in Client class
export interface ITxObjectWithBuffers extends ISignableObjectWithBuffer {
    data: {
        schema: string; // transaction schema
        account: string; // accountId
        maxFuel: number; // max fuel consumable by transaction
        nonce: Buffer; // nonce
        network: string; // networkName
        contract: Buffer | null; // smartContractHash
        method: string; // smartContractMethod
        caller: ITxPublicKeyObjectWithBuffers; // signerPublicKey
        args: Buffer; // msgpacked smartContractMethodArgs
    },
    signature: Buffer;
}

interface ITxPublicKeyObject {
    type: string; // algorithm type. E.g. 'ecdsa'
    curve: string; // curve type. E.g. 'secp384r1'
    value: Uint8Array; // actual value of the public key as 'raw'
}

/**
 * Structure returned by Transaction.toObject() method.
 */
export interface ITxObject extends ISignableObject {
    data: {
        schema: string; // transaction schema
        account: string; // accountId
        maxFuel: number; // max fuel consumable by transaction
        nonce: Uint8Array; // nonce
        network: string; // networkName
        contract: Uint8Array | null; // smartContractHash
        method: string; // smartContractMethod
        caller: ITxPublicKeyObject; // signerPublicKey
        args: Uint8Array; // msgpacked smartContractMethodArgs
    },
    signature: Uint8Array;
}

// Just for internal usage
interface IInternalTxDataStructure {
    schema: string; // transaction schema
    accountId: string;
    maxFuel: number; // max fuel consumable by transaction
    nonce: Buffer;
    networkName: string;
    smartContractHash: Buffer | null;
    smartContractMethod: string;
    signerPublicKey: BaseECKey;
    smartContractMethodArgs: Buffer,
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class Transaction extends Signable {
    protected _data: IInternalTxDataStructure;

    constructor(hash: TKeyGenAlgorithmValidHashValues = defaultSignHash) {
        super(hash);
        this._data = {
            schema: '',
            accountId: '',
            maxFuel: 0,
            nonce: Buffer.from([]),
            networkName: '',
            smartContractHash: null,
            smartContractMethod: '',
            signerPublicKey: new BaseECKey(EmptyKeyParams),
            smartContractMethodArgs: Buffer.from([]),
        };
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set schema(schema: string) {
        this._data.schema = schema;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get schema(): string {
        return this._data.schema;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set accountId(id: string) {
        this._data.accountId = id;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get accountId(): string {
        return this._data.accountId;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set maxFuel(maxFuel: number) {
        this._data.maxFuel = maxFuel;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get maxFuel(): number {
        return this._data.maxFuel;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public set nonce(nonce: Uint8Array) {
        if (nonce.byteLength !== 8) {
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._data.nonce = Buffer.from(nonce);
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public get nonce(): Uint8Array {
        return new Uint8Array(this._data.nonce);
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public set nonceHex(nonce: string) {
        if (nonce.length !== 16) { // two chars for each byte
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._data.nonce = Buffer.from(nonce, 'hex');
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public get nonceHex(): string {
        return this._data.nonce.toString('hex');
    }

    /** Automatically generates and sets new random nonce. */
    public genNonce(): void {
        const newNonce = new Uint8Array(8);
        WebCrypto.getRandomValues(newNonce);
        this._data.nonce = Buffer.from(newNonce);
    }

    /** Name of the network to which the transaction is addressed. */
    public set networkName(name: string) {
        this._data.networkName = name;
    }

    /** Name of the network to which the transaction is addressed. */
    public get networkName(): string {
        return this._data.networkName;
    }

    /** Smart contract hash, which will be invoked on target account. */
    public set smartContractHash(hash: Uint8Array) {
        if (hash.length > 0) {
            this._data.smartContractHash = Buffer.from(hash);
        } else {
            this._data.smartContractHash = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account. */
    public get smartContractHash(): Uint8Array {
        if (this._data.smartContractHash) {
            return new Uint8Array(this._data.smartContractHash);
        }
        return new Uint8Array([]);
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public set smartContractHashHex(hash: string) {
        if (hash.length > 0) {
            this._data.smartContractHash = Buffer.from(hash, 'hex');
        } else {
            this._data.smartContractHash = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public get smartContractHashHex(): string {
        if (this._data.smartContractHash) {
            return this._data.smartContractHash.toString('hex');
        }
        return '';
    }

    /** Smart contract hash, which will be invoked on target account. */
    public setSmartContractHash(hash: Uint8Array | string) {
        if (typeof hash === 'string') {
            this.smartContractHashHex = hash;
        } else {
            this.smartContractHash = hash;
        }
    }

    /** Method to call on the invoked smart contract */
    public set smartContractMethod(method: string) {
        this._data.smartContractMethod = method;
    }

    /** Method to call on the invoked smart contract */
    public get smartContractMethod(): string {
        return this._data.smartContractMethod;
    }

    /** Signer's public key. This is also done automatically during sign() */
    public set signerPublicKey(publicKey: BaseECKey) {
        this._data.signerPublicKey = publicKey;
    }

    /** Signer's public key. This is also done automatically during sign() */
    public get signerPublicKey(): BaseECKey {
        return this._data.signerPublicKey;
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public set smartContractMethodArgs(passedArgs: any) {
        this._data.smartContractMethodArgs = Buffer.from(objectToBytes(passedArgs));
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public get smartContractMethodArgs(): any {
        return bytesToObject(new Uint8Array(this._data.smartContractMethodArgs));
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public set smartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this._data.smartContractMethodArgs = Buffer.from(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public get smartContractMethodArgsBytes(): Uint8Array {
        return new Uint8Array(this._data.smartContractMethodArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public set smartContractMethodArgsHex(passedArgs: string) {
        this._data.smartContractMethodArgs = Buffer.from(passedArgs, 'hex');
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public get smartContractMethodArgsHex(): string {
        return this._data.smartContractMethodArgs.toString('hex');
    }

    /**
     * Converts transaction to a compact object with unnamed members
     * @returns - object, throws otherwise
     */
    public toUnnamedObject(): Promise<ITxUnnamedObject> {
        return new Promise((resolve, reject) => {
            const resultObj: ITxUnnamedObject = [
                [
                    this._data.schema,
                    this._data.accountId,
                    this._data.maxFuel,
                    this._data.nonce,
                    this._data.networkName,
                    this._data.smartContractHash,
                    this._data.smartContractMethod,
                    [
                        '',
                        '',
                        Buffer.from([]),
                    ],
                    this._data.smartContractMethodArgs,
                ],
                this._signature,
            ];
            if (this._data.signerPublicKey.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this._data.signerPublicKey.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const underscoreIndex = this._data.signerPublicKey.paramsId.indexOf('_');
                    if (underscoreIndex > -1) {
                        resultObj[0][7][0] = this._data.signerPublicKey.paramsId.slice(0, underscoreIndex);
                        resultObj[0][7][1] = this._data.signerPublicKey.paramsId.slice(underscoreIndex + 1);
                    } else {
                        resultObj[0][7][0] = this._data.signerPublicKey.paramsId;
                    }
                    resultObj[0][7][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts transaction to an object with binary members represented by Buffers
     * @returns - object, throws otherwise
     */
    public toObjectWithBuffers(): Promise<ITxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ITxUnnamedObject) => {
                    const resultObj: ITxObjectWithBuffers = {
                        data: {
                            schema: unnamedObject[0][0],
                            account: unnamedObject[0][1],
                            maxFuel: unnamedObject[0][2],
                            nonce: unnamedObject[0][3],
                            network: unnamedObject[0][4],
                            contract: unnamedObject[0][5],
                            method: unnamedObject[0][6],
                            caller: {
                                type: unnamedObject[0][7][0],
                                curve: unnamedObject[0][7][1],
                                value: unnamedObject[0][7][2],
                            },
                            args: unnamedObject[0][8],
                        },
                        signature: unnamedObject[1],
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts transaction to an object with binary members represented by Uint8Array
     * @returns - object, throws otherwise
     */
    public toObject(): Promise<ITxObject> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objBuffers: ITxObjectWithBuffers) => {
                    const resultObj: ITxObject = {
                        data: {
                            schema: this._data.schema, // TODO
                            account: objBuffers.data.account,
                            maxFuel: objBuffers.data.maxFuel,
                            nonce: new Uint8Array(objBuffers.data.nonce),
                            network: objBuffers.data.network,
                            contract: objBuffers.data.contract ? new Uint8Array(objBuffers.data.contract) : null,
                            method: objBuffers.data.method,
                            caller: {
                                type: objBuffers.data.caller.type,
                                curve: objBuffers.data.caller.curve,
                                value: new Uint8Array(objBuffers.data.caller.value),
                            },
                            args: new Uint8Array(objBuffers.data.args),
                        },
                        signature: new Uint8Array(objBuffers.signature),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts a compact object with unnamed members to a transaction
     * @param passedObj - compact object
     * @returns - true, throws otherwise
     */
    public fromUnnamedObject(passedObj: ITxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.schema = passedObj[0][0];
            this._data.accountId = passedObj[0][1];
            this._data.maxFuel = passedObj[0][2];
            this._data.nonce = passedObj[0][3];
            this._data.networkName = passedObj[0][4];
            this._data.smartContractHash = passedObj[0][5];
            this._data.smartContractMethod = passedObj[0][6];
            let keyParamsId: string = passedObj[0][7][0];
            if (passedObj[0][7][1].length > 0) {
                keyParamsId += `_${passedObj[0][7][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.signerPublicKey = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._data.smartContractMethodArgs = passedObj[0][8];
            this._signature = passedObj[1];
            if (keyParamsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.signerPublicKey.importBin(new Uint8Array(passedObj[0][7][2]))
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with buffers to a transaction
     * @param passedObj - object with buffers
     * @returns - true, throws otherwise
     */
    public fromObjectWithBuffers(passedObj: ITxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: ITxUnnamedObject = [
                [
                    passedObj.data.schema,
                    passedObj.data.account,
                    passedObj.data.maxFuel,
                    passedObj.data.nonce,
                    passedObj.data.network,
                    passedObj.data.contract ? passedObj.data.contract : null,
                    passedObj.data.method,
                    [
                        passedObj.data.caller.type,
                        passedObj.data.caller.curve,
                        passedObj.data.caller.value,
                    ],
                    passedObj.data.args,
                ],
                passedObj.signature,
            ];
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Converts an object with Uint8Arrays to a transaction
     * @param passedObj - object with Uint8Arrays
     * @returns - true, throws otherwise
     */
    public fromObject(passedObj: ITxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objBuffers: ITxObjectWithBuffers = {
                data: {
                    schema: passedObj.data.schema,
                    account: passedObj.data.account,
                    maxFuel: passedObj.data.maxFuel,
                    nonce: Buffer.from(passedObj.data.nonce),
                    network: passedObj.data.network,
                    contract: passedObj.data.contract ? Buffer.from(passedObj.data.contract) : null,
                    method: passedObj.data.method,
                    caller: {
                        type: passedObj.data.caller.type,
                        curve: passedObj.data.caller.curve,
                        value: Buffer.from(passedObj.data.caller.value),
                    },
                    args: Buffer.from(passedObj.data.args),
                },
                signature: Buffer.from(passedObj.signature),
            };
            this.fromObjectWithBuffers(objBuffers)
                .then((result: boolean) => {
                    return resolve(result);
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
            privateKey.extractPublic()
                .then((publicKey: BaseECKey) => {
                    this.signerPublicKey = publicKey;
                    super.sign(privateKey)
                        .then(() => {
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
    public verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            super.verifySignature(this._data.signerPublicKey)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
