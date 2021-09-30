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
    /** target AccountId */
    [0]: string;
    /** Nonce */
    [1]: Buffer;
    /** Network name */
    [2]: string;
    /** Smart contract hash */
    [3]: Buffer | null;
    /** Smart contract method */
    [4]: string;
    /** Signer's public key */
    [5]: ITxUnnamedPublicKeyObject;
    /** Msgpacked smart contract args */
    [6]: Buffer;
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
        account: string; // accountId
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
        account: string; // accountId
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
    accountId: string;
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
            accountId: '',
            nonce: Buffer.from([]),
            networkName: '',
            smartContractHash: null,
            smartContractMethod: '',
            signerPublicKey: new BaseECKey(EmptyKeyParams),
            smartContractMethodArgs: Buffer.from([]),
        };
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set accountId(id: string) {
        this._data.accountId = id;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get accountId(): string {
        return this._data.accountId;
    }

    /** Sets a random 8-bytes value as an anti-replay protection. */
    public set nonce(nonce: Uint8Array) {
        if (nonce.byteLength !== 8) {
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._data.nonce = Buffer.from(nonce);
    }

    /** Gets the nonce currently set for this transaction. */
    public get nonce(): Uint8Array {
        return this._data.nonce;
    }

    /** Sets a random 8-bytes value as an anti-replay protection. */
    public set nonceHex(nonce: string) {
        if (nonce.length !== 16) { // two chars for each byte
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._data.nonce = Buffer.from(nonce, 'hex');
    }

    /** Gets the nonce currently set for this transaction. */
    public get nonceHex(): string {
        return this._data.nonce.toString('hex');
    }

    /** Automatically generates and sets new random nonce. */
    public genNonce(): void {
        const newNonce = new Uint8Array(8);
        WebCrypto.getRandomValues(newNonce);
        this._data.nonce = Buffer.from(newNonce);
    }

    /** Sets the name of the network to which the transaction is addressed. */
    public set networkName(name: string) {
        this._data.networkName = name;
    }

    /** Gets the name of the network to which the transaction is addressed. */
    public get networkName(): string {
        return this._data.networkName;
    }

    /** Sets smart contract hash, which will be invoked on target account.
     */
    public set smartContractHash(hash: Uint8Array) {
        if (hash.length > 0) {
            this._data.smartContractHash = Buffer.from(hash);
        } else {
            this._data.smartContractHash = null;
        }
    }

    /** Gets smart contract hash, which will be invoked on target account. */
    public get smartContractHash(): Uint8Array {
        if (this._data.smartContractHash) {
            return new Uint8Array(this._data.smartContractHash);
        }
        return new Uint8Array([]);
    }

    /** Sets smart contract hash, which will be invoked on target account.
     * Accepts hex string
     */
    public set smartContractHashHex(hash: string) {
        if (hash.length > 0) {
            this._data.smartContractHash = Buffer.from(hash, 'hex');
        } else {
            this._data.smartContractHash = null;
        }
    }

    /** Gets smart contract hash as hex string. */
    public get smartContractHashHex(): string {
        if (this._data.smartContractHash) {
            return this._data.smartContractHash.toString('hex');
        }
        return '';
    }

    /** Sets smart contract hash, which will be invoked on target account.
     * Accepts hex string and binary
     */
    public setSmartContractHash(hash: Uint8Array | string) {
        if (typeof hash === 'string') {
            this.smartContractHashHex = hash;
        } else {
            this.smartContractHash = hash;
        }
    }

    /** method to call from the invoked smart contract */
    public set smartContractMethod(method: string) {
        this._data.smartContractMethod = method;
    }

    public get smartContractMethod(): string {
        return this._data.smartContractMethod;
    }

    /** sets signer's public key. This is done
     * automatically during sign() */
    public set signerPublicKey(publicKey: BaseECKey) {
        this._data.signerPublicKey = publicKey;
    }

    public get signerPublicKey(): BaseECKey {
        return this._data.signerPublicKey;
    }

    /** Sets args which will be passed to invoked smart contract
     * method as a plain json object (of any type. Strings, numbers,
     * objects, booleans. You name it.). Passed args will be serialized
     * into an array of bytes. */
    public set smartContractMethodArgs(passedArgs: any) {
        this._data.smartContractMethodArgs = Buffer.from(objectToBytes(passedArgs));
    }

    /** This function tries to decode args bytes to js object before retuurning it. */
    public get smartContractMethodArgs(): any {
        return bytesToObject(new Uint8Array(this._data.smartContractMethodArgs));
    }

    /** Sets args which will be passed to invoked smart contract
     * method as already constructed array of byttes. This is,
     * for example, useful when you want to encrypt the data you pass
     * to the smart contract.
     */
    public set smartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this._data.smartContractMethodArgs = Buffer.from(passedArgs);
    }

    /** this function returns plain args bytes */
    public get smartContractMethodArgsBytes(): Uint8Array {
        return new Uint8Array(this._data.smartContractMethodArgs);
    }

    /** Sets args which will be passed to invoked smart contract
     * method as already constructed array of byttes. This is,
     * for example, useful when you want to encrypt the data you pass
     * to the smart contract.
     */
    public set smartContractMethodArgsHex(passedArgs: string) {
        this._data.smartContractMethodArgs = Buffer.from(passedArgs, 'hex');
    }

    /** this function returns plain args bytes */
    public get smartContractMethodArgsHex(): string {
        return this._data.smartContractMethodArgs.toString('hex');
    }

    public toUnnamedObject(): Promise<ITxUnnamedObject> {
        return new Promise((resolve, reject) => {
            const resultObj: ITxUnnamedObject = [
                [
                    this._data.accountId,
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
                        resultObj[0][5][0] = this._data.signerPublicKey.paramsId.slice(0, underscoreIndex)
                        resultObj[0][5][1] = this._data.signerPublicKey.paramsId.slice(underscoreIndex + 1);
                    } else {
                        resultObj[0][5][0] = this._data.signerPublicKey.paramsId;
                    }
                    resultObj[0][5][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: ITxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.accountId = passedObj[0][0];
            this._data.nonce = passedObj[0][1];
            this._data.networkName = passedObj[0][2];
            this._data.smartContractHash = passedObj[0][3];
            this._data.smartContractMethod = passedObj[0][4];
            let keyParamsId: string = passedObj[0][5][0];
            if (passedObj[0][5][1].length > 0) {
                keyParamsId += `_${passedObj[0][5][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._data.signerPublicKey = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._data.smartContractMethodArgs = passedObj[0][6];
            this._signature = passedObj[1];
            if (keyParamsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._data.signerPublicKey.importBin(new Uint8Array(passedObj[0][5][2]))
                .then(() => {
                    return resolve(true);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<ITxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ITxUnnamedObject) => {
                    const resultObj: ITxObjectWithBuffers = {
                        data: {
                            // schema: this._data.schema, // TODO
                            account: unnamedObject[0][0],
                            nonce: unnamedObject[0][1],
                            network: unnamedObject[0][2],
                            contract: unnamedObject[0][3],
                            method: unnamedObject[0][4],
                            caller: {
                                type: unnamedObject[0][5][0],
                                curve: unnamedObject[0][5][1],
                                value: unnamedObject[0][5][2],
                            },
                            args: unnamedObject[0][6],
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

    public fromObjectWithBuffers(passedObj: ITxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let unnamedObject: ITxUnnamedObject = [
                [
                    passedObj.data.account,
                    passedObj.data.nonce,
                    passedObj.data.network,
                    passedObj.data.contract,
                    passedObj.data.method,
                    [
                        passedObj.data.caller.type,
                        passedObj.data.caller.curve,
                        passedObj.data.caller.value,
                    ],
                    passedObj.data.args,
                ],
                passedObj.signature
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

    /** Exports transaction as an easy-to-use javascript object.
     * Importable with fromObject() method.
    */
    public toObject(): Promise<ITxObject> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: ITxUnnamedObject) => {
                    const resultObj: ITxObject = {
                        data: {
                            // schema: this._data.schema, // TODO
                            account: unnamedObject[0][0],
                            nonce: new Uint8Array(unnamedObject[0][1]),
                            network: unnamedObject[0][2],
                            contract: unnamedObject[0][3] ? new Uint8Array(unnamedObject[0][3]) : null,
                            method: unnamedObject[0][4],
                            caller: {
                                type: unnamedObject[0][5][0],
                                curve: unnamedObject[0][5][1],
                                value: new Uint8Array(unnamedObject[0][5][2]),
                            },
                            args: new Uint8Array(unnamedObject[0][6]),
                        },
                        signature: new Uint8Array(unnamedObject[1]),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                })
        });
    }

    /** Imports transaction from a plain javascript object.
     * Exportable with toObject() method */
    public fromObject(passedObj: ITxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let unnamedObject: ITxUnnamedObject = [
                [
                    passedObj.data.account,
                    Buffer.from(passedObj.data.nonce),
                    passedObj.data.network,
                    passedObj.data.contract ? Buffer.from(passedObj.data.contract) : null,
                    passedObj.data.method,
                    [
                        passedObj.data.caller.type,
                        passedObj.data.caller.curve,
                        Buffer.from(passedObj.data.caller.value),
                    ],
                    Buffer.from(passedObj.data.args),
                ],
                Buffer.from(passedObj.signature)
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

    /** Exports transaction as ready to send bytes.
     * Importable by fromBytes() method.
    */
    public toBytes(): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((obj: ITxUnnamedObject) => {
                    return resolve(objectToBytes(obj));
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /** Imports transaction from bytes serialized
     * with toBytes() method */
    public fromBytes(passedBytes: Uint8Array): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objWithBuffers: ITxUnnamedObject = bytesToObject(passedBytes);
            this.fromUnnamedObject(objWithBuffers)
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
