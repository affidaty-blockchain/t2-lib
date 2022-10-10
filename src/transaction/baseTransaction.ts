import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    TTxSchemaType,
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObjectWithBuffers,
    ICommonParentTxDataObject,
} from './commonParentTxData';
import {
    BaseTxData,
} from './baseTxData';
import {
    Signable,
    ISignableObject,
    ISignableObjectWithBuffer,
    ISignableUnnamedObject,
    ISignableUnnamedObjectNoTag,
} from '../signable';

export type TSchemaToDataMap = Map<TTxSchemaType, (schema?: TTxSchemaType)=>CommonParentTxData>;

export interface IBaseTxUnnamedObject extends ISignableUnnamedObject {
    [1]: ICommonParentTxDataUnnamedObject,
    [2]?: Buffer;
}

export interface IBaseTxUnnamedObjectNoTag extends ISignableUnnamedObjectNoTag {
    [0]: ICommonParentTxDataUnnamedObject,
    [1]?: Buffer;
}

// exported for usage in Client class
export interface IBaseTxObjectWithBuffers extends ISignableObjectWithBuffer {
    data: ICommonParentTxDataObjectWithBuffers,
    signature?: Buffer;
}

/**
 * Structure returned by Transaction.toObject() method.
 */
export interface IBaseTxObject extends ISignableObject {
    data: ICommonParentTxDataObject,
    signature?: Uint8Array;
}

/**
 * Class for automatic transaction creation, management and transcoding
 */
export class BaseTransaction extends Signable {
    protected _schemaClassMap: TSchemaToDataMap;

    protected _data: CommonParentTxData;

    constructor(
        schema: TTxSchemaType = BaseTxData.defaultSchema,
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(hash);
        this._schemaClassMap = new Map();
        this._data = new CommonParentTxData(schema);
        this._typeTag = this._data.typeTag;
    }

    public set schemaClassMap(schemaClassMap: TSchemaToDataMap) {
        this._schemaClassMap = schemaClassMap;
    }

    public get schemaClassMap(): TSchemaToDataMap {
        return this._schemaClassMap;
    }

    public get data(): CommonParentTxData {
        return this._data;
    }

    public set data(data: CommonParentTxData) {
        this._data = data;
    }

    /** Automatically generates and sets new random nonce. */
    public genNonce(): void {
        this._data.genNonce();
    }

    /**
     * Exports transaction to a compact object with unnamed members,
     * ready to be encoded with msgpack
     * and sent over the network
     * @returns - compact unnamed object
     */
    public toUnnamedObject(): Promise<IBaseTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: ICommonParentTxDataUnnamedObject) => {
                    const resultObj: IBaseTxUnnamedObject = [
                        this._data.typeTag,
                        unnamedData,
                    ];
                    if (this._signature.byteLength > 0) {
                        resultObj[2] = this._signature;
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toUnnamedObjectNoTag(): Promise<IBaseTxUnnamedObjectNoTag> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObj: IBaseTxUnnamedObject) => {
                    const resultObj: IBaseTxUnnamedObjectNoTag = [
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

    /**
     * Exports transaction to an object with named members and binary
     * values represented by Buffers
     * @returns - object with named members and binary values represented by Buffers
     */
    public toObjectWithBuffers(): Promise<IBaseTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: ICommonParentTxDataObjectWithBuffers) => {
                    const resultObj: IBaseTxObjectWithBuffers = {
                        type: this._data.typeTag,
                        data: dataObj,
                    };
                    if (this._signature.byteLength > 0) {
                        resultObj.signature = this._signature;
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Exports transaction to an object with named members and binary
     * values represented by Uint8Arrays
     * @returns - object with named members and binary values represented by Uint8Arrays
     */
    public toObject(): Promise<IBaseTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: ICommonParentTxDataObject) => {
                    const resultObj: IBaseTxObject = {
                        type: this._data.typeTag,
                        data: dataObj,
                    };
                    if (this._signature.byteLength > 0) {
                        resultObj.signature = new Uint8Array(this._signature);
                    }
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports transaction from a compact object with unnamed members
     * @returns - compact unnamed object
     */
    public fromUnnamedObject(passedObj: IBaseTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this._schemaClassMap.has(passedObj[1][0])) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = this._schemaClassMap.get(passedObj[1][0])!();
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    this._typeTag = this._data.typeTag;
                    if (result && passedObj[2]) {
                        this._signature = passedObj[2];
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    protected fromUnnamedObjectNoTag(passedObj: IBaseTxUnnamedObjectNoTag): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedArg: IBaseTxUnnamedObject = [
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

    /**
     * Imports transaction from an object with named members and binary
     * values represented by Buffers
     * @param passedObj - object with named members and binary values represented by Buffers
     */
    public fromObjectWithBuffers(passedObj: IBaseTxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this._schemaClassMap.has(passedObj.data.schema)) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = this._schemaClassMap.get(passedObj.data.schema)!();
            this._data.fromObjectWithBuffers(passedObj.data)
                .then((result: boolean) => {
                    this._typeTag = this._data.typeTag;
                    if (result && passedObj.signature) {
                        this._signature = passedObj.signature;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    /**
     * Imports transaction from an object with named members and binary
     * values represented by Uint8Arrays
     * @param passedObj - object with named members and binary values represented by Uint8Arrays
     */
    public fromObject(passedObj: IBaseTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this._schemaClassMap.has(passedObj.data.schema)) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data = this._schemaClassMap.get(passedObj.data.schema)!();
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    this._typeTag = this._data.typeTag;
                    if (result && passedObj.signature) {
                        this._signature = Buffer.from(passedObj.signature);
                    }
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
                    this._data.signerPublicKey = publicKey;
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

    /**
     * Computes the transaction ticket which would be returned by blockchain
     * itself on transaction submission.
     * @returns - ticket string
     */
    public getTicket(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._data.getTicket()
                .then((ticket: string) => {
                    return resolve(ticket);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
