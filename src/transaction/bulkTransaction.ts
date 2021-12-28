import * as Errors from '../errors';
import { TKeyGenAlgorithmValidHashValues } from '../cryptography/baseTypes';
import {
    DEF_SIGN_HASH_ALGORITHM as defaultSignHash,
} from '../cryptography/cryptoDefaults';
import { TxSchemas } from './commonParentTxData';
import {
    BaseTransaction,
    IBaseTxUnnamedObject,
    IBaseTxObjectWithBuffers,
    IBaseTxObject,
} from './baseTransaction';
import {
    BulkTxData,
    IBulkTxDataUnnamedObject,
    IBulkTxDataObjectWithBuffers,
    IBulkTxDataObject,
} from './bulkTxData';

const DEFAULT_SCHEMA = TxSchemas.BULK_TX;

export interface IBulkTxUnnamedObject extends IBaseTxUnnamedObject {
    [1]: IBulkTxDataUnnamedObject;
    [2]: Buffer;
}

export interface IBulkTxObjectWithBuffers extends IBaseTxObjectWithBuffers {
    data: IBulkTxDataObjectWithBuffers;
    signature: Buffer;
}

export interface IBulkTxObject extends IBaseTxObject {
    data: IBulkTxDataObject;
    signature: Uint8Array;
}

export class BulkTransaction extends BaseTransaction {
    protected _data: BulkTxData;

    constructor(
        hash: TKeyGenAlgorithmValidHashValues = defaultSignHash,
    ) {
        super(BulkTxData.defaultSchema, hash);
        this._data = new BulkTxData(DEFAULT_SCHEMA);
        this._typeTag = this._data.typeTag;
    }

    public get data(): BulkTxData {
        return this._data;
    }

    public set data(data: BulkTxData) {
        this._data = data;
    }

    public toUnnamedObject(): Promise<IBulkTxUnnamedObject> {
        return new Promise((resolve, reject) => {
            this._data.toUnnamedObject()
                .then((unnamedData: IBulkTxDataUnnamedObject) => {
                    const resultObj: IBulkTxUnnamedObject = [
                        this._data.typeTag,
                        unnamedData,
                        this._signature,
                    ];
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBulkTxObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this._data.toObjectWithBuffers()
                .then((dataObj: IBulkTxDataObjectWithBuffers) => {
                    const resultObj: IBulkTxObjectWithBuffers = {
                        type: this._data.typeTag,
                        data: dataObj,
                        signature: this._signature,
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<IBulkTxObject> {
        return new Promise((resolve, reject) => {
            this._data.toObject()
                .then((dataObj: IBulkTxDataObject) => {
                    const resultObj: IBulkTxObject = {
                        type: this._data.typeTag,
                        data: dataObj,
                        signature: new Uint8Array(this._signature),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: IBulkTxUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (passedObj[1][0] !== DEFAULT_SCHEMA) {
                return reject(new Error(Errors.INVALID_SCHEMA));
            }
            this._data.fromUnnamedObject(passedObj[1])
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                        this._signature = passedObj[2];
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
     * values represented by Buffers
     * @param passedObj - object with named members and binary values represented by Buffers
     */
    public fromObjectWithBuffers(passedObj: IBulkTxObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObjectWithBuffers(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                        this._signature = passedObj.signature;
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObject(passedObj: IBulkTxObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.fromObject(passedObj.data)
                .then((result: boolean) => {
                    if (result) {
                        this._typeTag = this._data.typeTag;
                        this._signature = Buffer.from(passedObj.signature);
                    }
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public verify(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._data.root.getTicket()
                .then((rootTicket: string) => {
                    const nodesVerifyPromises: Array<Promise<boolean>> = [];
                    for (let i = 0; i < this._data.nodes.length; i += 1) {
                        if (this._data.nodes[i].data.dependsOnHex !== rootTicket) {
                            return reject(new Error(`Node transaction with index ${i} not dependant on root.`));
                        }
                        if (this._data.nodes[i].data.networkName
                            !== this._data.root.data.networkName
                        ) {
                            return reject(new Error(`Node transaction with index ${i} was created for a different network than root.`));
                        }
                        nodesVerifyPromises.push(this._data.nodes[i].verify());
                    }
                    Promise.allSettled(nodesVerifyPromises)
                        .then((results) => {
                            for (let i = 0; i < results.length; i += 1) {
                                if (results[i].status === 'rejected'
                                    || !(results[i] as PromiseFulfilledResult<boolean>).value
                                ) {
                                    return reject(new Error(`Node transaction with index ${i} could not be verified.`));
                                }
                            }
                            this.verifySignature(this._data.root.data.signerPublicKey)
                                .then((result) => {
                                    return resolve(result);
                                })
                                .catch((error: any) => {
                                    return reject(error);
                                });
                        });
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
